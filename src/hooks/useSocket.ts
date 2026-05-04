// ============================================================
// Up and Down – Socket.io Client Hook
// ============================================================

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  BotDifficulty,
  GameSettings,
} from '@/lib/types';
import { useAppStore } from '@/lib/store';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let globalSocket: TypedSocket | null = null;

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const {
    setSocketConnected,
    setRoomInfo,
    setRoomList,
    setGameState,
    setError,
    queueSFX,
    setPlayerId,
    addReaction,
    addChatMessage,
    setTurnSecondsLeft,
  } = useAppStore();

  useEffect(() => {
    if (globalSocket?.connected) {
      socketRef.current = globalSocket;
      setSocketConnected(true);
      return;
    }

    const url = typeof window !== 'undefined' ? window.location.origin : '';
    const socket: TypedSocket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    globalSocket = socket;
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      // Try to reconnect if we have a saved playerId
      const savedPlayerId = localStorage.getItem('upanddown_playerId');
      if (savedPlayerId) {
        (socket as any).emit('room:reconnect', { playerId: savedPlayerId });
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('room:info', (info) => {
      setRoomInfo(info);
    });

    socket.on('room:list', (rooms) => {
      setRoomList(rooms);
    });

    socket.on('game:state', (state) => {
      setGameState(state);
      // Extract playerId from state (we are the player whose cards are visible)
      const me = state.players.find(
        (p) => p.hand.length > 0 && p.hand[0]?.id !== 'hidden'
      );
      if (me) {
        setPlayerId(me.id);
        // Save for reconnection
        try { localStorage.setItem('upanddown_playerId', me.id); } catch {}
      }
    });

    socket.on('game:error', (msg) => {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    });

    socket.on('sfx:play', (sfx) => {
      queueSFX(sfx);
    });

    socket.on('game:reaction', ({ playerId, playerName, emoji }) => {
      addReaction(playerId, playerName, emoji);
    });

    socket.on('game:timer', ({ secondsLeft }) => {
      setTurnSecondsLeft(secondsLeft);
    });

    socket.on('game:chat', ({ playerId, playerName, message }) => {
      addChatMessage(playerId, playerName, message);
    });

    return () => {
      // Don't disconnect on unmount — keep connection alive
    };
  }, [setSocketConnected, setRoomInfo, setRoomList, setGameState, setError, queueSFX, setPlayerId, addReaction, addChatMessage, setTurnSecondsLeft]);

  const createRoom = useCallback(
    (playerName: string, maxPlayers: number, settings?: GameSettings) => {
      socketRef.current?.emit('room:create', { playerName, maxPlayers, settings });
    },
    []
  );

  const joinRoom = useCallback(
    (roomId: string, playerName: string) => {
      socketRef.current?.emit('room:join', { roomId, playerName });
    },
    []
  );

  const listRooms = useCallback(() => {
    socketRef.current?.emit('room:list');
  }, []);

  const startGame = useCallback((roomId: string) => {
    socketRef.current?.emit('game:start', { roomId });
  }, []);

  const playCard = useCallback((roomId: string, cardId: string) => {
    socketRef.current?.emit('game:playCard', { roomId, cardId });
  }, []);

  const drawCard = useCallback((roomId: string) => {
    socketRef.current?.emit('game:drawCard', { roomId });
  }, []);

  const announceUpDown = useCallback((roomId: string) => {
    socketRef.current?.emit('game:announceUpDown', { roomId });
  }, []);

  const contre = useCallback(
    (roomId: string, targetPlayerId: string) => {
      socketRef.current?.emit('game:contre', { roomId, targetPlayerId });
    },
    []
  );

  const restartGame = useCallback((roomId: string) => {
    socketRef.current?.emit('game:restart', { roomId });
  }, []);

  const quitGame = useCallback((roomId: string) => {
    socketRef.current?.emit('game:quit', { roomId });
  }, []);

  const addBot = useCallback((roomId: string) => {
    socketRef.current?.emit('room:addBot', { roomId });
  }, []);

  const startBotMatch = useCallback(
    (playerName: string, botCount: number, botDifficulty: BotDifficulty, settings?: GameSettings) => {
      socketRef.current?.emit('game:startBotMatch', { playerName, botCount, botDifficulty, settings });
    },
    []
  );

  return {
    createRoom,
    joinRoom,
    listRooms,
    startGame,
    startBotMatch,
    playCard,
    drawCard,
    announceUpDown,
    contre,
    sendReaction: useCallback((roomId: string, emoji: string) => {
      socketRef.current?.emit('game:reaction', { roomId, emoji });
    }, []),
    sendChat: useCallback((roomId: string, message: string) => {
      socketRef.current?.emit('game:chat', { roomId, message });
    }, []),
    restartGame,
    quitGame,
    addBot,
  };
}
