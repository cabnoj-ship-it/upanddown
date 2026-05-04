// ============================================================
// Up and Down – WebRTC Voice Chat (peer-to-peer mesh)
// ============================================================

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types';
import { useAppStore } from '@/lib/store';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

type VoiceSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface PeerConnection {
  pc: RTCPeerConnection;
  audioEl: HTMLAudioElement;
  stream: MediaStream | null;
  vadCleanup?: () => void;
}

// Global refs to persist across re-renders
let voiceSocket: VoiceSocket | null = null;
let localStream: MediaStream | null = null;
let peers = new Map<string, PeerConnection>();

function getVoiceSocket(): VoiceSocket {
  if (voiceSocket) return voiceSocket;
  // Reuse main socket if possible by connecting to same URL
  voiceSocket = io({ transports: ['websocket'], autoConnect: true });
  return voiceSocket;
}

export function useVoiceChat() {
  const {
    voiceEnabled,
    voiceConnected,
    voiceMutedSelf,
    voiceMutedPeers,
    voiceInputDevice,
    playerId,
    roomInfo,
    gameState,
    setVoiceConnected,
    setPeerSpeaking,
  } = useAppStore();

  const socketRef = useRef<VoiceSocket | null>(null);
  const currentRoomId = roomInfo?.roomId ?? gameState?.roomId ?? null;

  // Mute/unmute local stream tracks
  useEffect(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !voiceMutedSelf;
    });
  }, [voiceMutedSelf]);

  // Mute/unmute remote audio (peer-specific)
  useEffect(() => {
    peers.forEach((peer, peerId) => {
      if (peer.audioEl) {
        peer.audioEl.muted = !!voiceMutedPeers[peerId];
      }
    });
  }, [voiceMutedPeers]);

  const cleanupPeer = useCallback((peerId: string) => {
    const peer = peers.get(peerId);
    if (!peer) return;
    peer.vadCleanup?.();
    peer.pc.close();
    if (peer.audioEl) {
      peer.audioEl.pause();
      peer.audioEl.srcObject = null;
      peer.audioEl.remove();
    }
    peers.delete(peerId);
    setPeerSpeaking(peerId, false);
  }, [setPeerSpeaking]);

  const cleanupAll = useCallback(() => {
    peers.forEach((_, peerId) => cleanupPeer(peerId));
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      localStream = null;
    }
    setVoiceConnected(false);
  }, [cleanupPeer, setVoiceConnected]);

  const setupVAD = useCallback((stream: MediaStream, peerId: string): () => void => {
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AC) return () => {};
      const audioCtx = new AC();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let rafId = 0;
      let speaking = false;

      const loop = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const isNow = avg > 15; // threshold
        if (isNow !== speaking) {
          speaking = isNow;
          setPeerSpeaking(peerId, speaking);
        }
        rafId = requestAnimationFrame(loop);
      };
      loop();

      return () => {
        cancelAnimationFrame(rafId);
        audioCtx.close().catch(() => {});
      };
    } catch {
      return () => {};
    }
  }, [setPeerSpeaking]);

  const createPeerConnection = useCallback((remotePeerId: string, isInitiator: boolean) => {
    if (peers.has(remotePeerId)) return peers.get(remotePeerId)!;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioEl.muted = !!voiceMutedPeers[remotePeerId];
    document.body.appendChild(audioEl);

    const peer: PeerConnection = { pc, audioEl, stream: null };
    peers.set(remotePeerId, peer);

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream!));
    }

    // Receive remote stream
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      peer.stream = stream;
      audioEl.srcObject = stream;
      audioEl.play().catch(() => {});
      // Voice activity detection
      peer.vadCleanup = setupVAD(stream, remotePeerId);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && currentRoomId) {
        socketRef.current.emit('voice:ice-candidate', {
          roomId: currentRoomId,
          targetPeerId: remotePeerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(remotePeerId);
      }
    };

    // Initiator sends offer
    if (isInitiator && socketRef.current && currentRoomId) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (pc.localDescription && socketRef.current && currentRoomId) {
            socketRef.current.emit('voice:offer', {
              roomId: currentRoomId,
              targetPeerId: remotePeerId,
              offer: pc.localDescription.toJSON() as RTCSessionDescriptionInit,
            });
          }
        })
        .catch((e) => console.error('[Voice] Offer error:', e));
    }

    return peer;
  }, [currentRoomId, voiceMutedPeers, cleanupPeer, setupVAD]);

  // Main connection lifecycle
  useEffect(() => {
    if (!voiceEnabled || !currentRoomId || !playerId) {
      cleanupAll();
      return;
    }

    let cancelled = false;

    const start = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: voiceInputDevice
            ? { deviceId: { exact: voiceInputDevice }, echoCancellation: true, noiseSuppression: true }
            : { echoCancellation: true, noiseSuppression: true },
          video: false,
        };
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          localStream.getTracks().forEach((t) => t.stop());
          localStream = null;
          return;
        }

        // Apply current mute state
        localStream.getAudioTracks().forEach((t) => { t.enabled = !useAppStore.getState().voiceMutedSelf; });

        // Connect socket
        const socket = getVoiceSocket();
        socketRef.current = socket;

        socket.on('voice:peer-joined', ({ peerId }) => {
          // New peer: we initiate (by convention, lower id initiates)
          const me = useAppStore.getState().playerId;
          if (!me) return;
          const shouldInitiate = me < peerId;
          if (shouldInitiate) {
            createPeerConnection(peerId, true);
          } else {
            // Wait for offer from the new peer? Actually new peer should wait for offers from existing peers.
            // Convention: existing peers (receiving peer-joined) initiate.
            createPeerConnection(peerId, true);
          }
        });

        socket.on('voice:peer-left', ({ peerId }) => {
          cleanupPeer(peerId);
        });

        socket.on('voice:offer', async ({ fromPeerId, offer }) => {
          const peer = createPeerConnection(fromPeerId, false);
          try {
            await peer.pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.pc.createAnswer();
            await peer.pc.setLocalDescription(answer);
            if (socketRef.current && currentRoomId) {
              socketRef.current.emit('voice:answer', {
                roomId: currentRoomId,
                targetPeerId: fromPeerId,
                answer: peer.pc.localDescription!.toJSON() as RTCSessionDescriptionInit,
              });
            }
          } catch (e) {
            console.error('[Voice] Offer handling error:', e);
          }
        });

        socket.on('voice:answer', async ({ fromPeerId, answer }) => {
          const peer = peers.get(fromPeerId);
          if (!peer) return;
          try {
            await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (e) {
            console.error('[Voice] Answer error:', e);
          }
        });

        socket.on('voice:ice-candidate', async ({ fromPeerId, candidate }) => {
          const peer = peers.get(fromPeerId);
          if (!peer) return;
          try {
            await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('[Voice] ICE error:', e);
          }
        });

        // Announce we joined the voice
        socket.emit('voice:join', { roomId: currentRoomId });
        setVoiceConnected(true);
      } catch (err) {
        console.error('[Voice] Failed to start:', err);
        useAppStore.getState().setVoiceEnabled(false);
        setVoiceConnected(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      // Tell others we're leaving
      if (socketRef.current && currentRoomId) {
        socketRef.current.emit('voice:leave', { roomId: currentRoomId });
      }
      if (socketRef.current) {
        socketRef.current.off('voice:peer-joined');
        socketRef.current.off('voice:peer-left');
        socketRef.current.off('voice:offer');
        socketRef.current.off('voice:answer');
        socketRef.current.off('voice:ice-candidate');
      }
      cleanupAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled, currentRoomId, playerId, voiceInputDevice]);

  return { voiceConnected };
}
