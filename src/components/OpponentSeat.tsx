// ============================================================
// Up and Down – Opponent Seat (UNO-style compact player card)
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Player, GameState } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';

interface Props {
  opponent: Player;
  isActive: boolean;
  gameState: GameState;
  onContre: () => void;
}

const AVATAR_COLORS = [
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-fuchsia-500 to-pink-600',
];

export default function OpponentSeat({ opponent, isActive, gameState, onContre }: Props) {
  // Reactive cooldown
  const [, setTick] = useState(0);
  useEffect(() => {
    const until = gameState.contreCooldownUntil;
    if (Date.now() >= until) return;
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [gameState.contreCooldownUntil]);

  const voiceConnected = useAppStore((s) => s.voiceConnected);
  const isSpeaking = useAppStore((s) => s.voiceSpeakingPeers[opponent.id] ?? false);
  const isMutedPeer = useAppStore((s) => s.voiceMutedPeers[opponent.id] ?? false);
  const togglePeerMuted = useAppStore((s) => s.togglePeerMuted);

  const colorIndex = opponent.name.charCodeAt(0) % AVATAR_COLORS.length;
  const cooldownRemaining = Math.max(0, gameState.contreCooldownUntil - Date.now());
  const canContre =
    !opponent.isBot === false && // allow both
    opponent.hand.length === 2 &&
    !opponent.hasAnnouncedUpDown &&
    gameState.enableAnnounce &&
    cooldownRemaining === 0;
  const isContrableSoon =
    opponent.hand.length === 2 && !opponent.hasAnnouncedUpDown && gameState.enableAnnounce;

  const eliminated = opponent.finishOrder !== null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: eliminated ? 0.35 : 1, y: 0 }}
      className={`relative flex flex-col items-center gap-1.5 min-w-[5rem] max-w-[8rem]
        px-2 py-2 rounded-2xl border backdrop-blur-md transition-all
        ${isActive
          ? 'border-yellow-400/70 bg-yellow-400/10 shadow-xl shadow-yellow-400/20'
          : 'border-white/10 bg-black/20'
        }
        ${!opponent.isConnected ? 'opacity-40' : ''}
      `}
    >
      {/* Active glow */}
      {isActive && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -inset-0.5 rounded-2xl bg-yellow-400/20 blur-md -z-10 pointer-events-none"
        />
      )}

      {/* Avatar + name */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative shrink-0">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[colorIndex]}
            flex items-center justify-center text-white font-black text-sm shadow-lg
            ${isSpeaking && !isMutedPeer ? 'ring-2 ring-green-400' : ''}`}
          >
            {opponent.isBot ? '🤖' : opponent.name[0]?.toUpperCase()}
          </div>
          {isSpeaking && !isMutedPeer && !opponent.isBot && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-green-400 pointer-events-none"
              animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-black text-white truncate leading-tight">
            {opponent.name}
          </span>
          <span className="text-[0.6rem] text-white/40 font-bold leading-tight">
            {opponent.hand.length} 🃏
          </span>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-1 w-full justify-center flex-wrap">
        {opponent.hasAnnouncedUpDown && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-1.5 py-0.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[0.5rem] font-black rounded-md shadow-md"
          >
            U&D!
          </motion.span>
        )}
        {eliminated && (
          <span className="px-1.5 py-0.5 bg-white/10 text-white/70 text-[0.5rem] font-black rounded-md">
            #{opponent.finishOrder}
          </span>
        )}
        {!eliminated && opponent.isBot && (
          <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-300 text-[0.5rem] font-black rounded-md">
            BOT
          </span>
        )}

        {/* Voice mute for this peer */}
        {!opponent.isBot && voiceConnected && (
          <button
            onClick={() => togglePeerMuted(opponent.id)}
            className={`w-5 h-5 rounded-full text-[0.55rem] flex items-center justify-center transition
              ${isMutedPeer ? 'bg-red-500/30 text-red-300' : 'bg-white/5 text-white/40 hover:bg-white/15'}`}
            title={isMutedPeer ? 'Réactiver ce joueur' : 'Couper ce joueur'}
          >
            {isMutedPeer ? '🔇' : '🔊'}
          </button>
        )}
      </div>

      {/* Contre button (shows prominently when available) */}
      <AnimatePresence>
        {canContre && (
          <motion.button
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: [1, 1.08, 1], y: 0 }}
            exit={{ scale: 0 }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            whileTap={{ scale: 0.9 }}
            onClick={onContre}
            className="w-full px-2 py-1 rounded-lg font-black text-[0.6rem]
              bg-gradient-to-r from-red-600 to-rose-700 text-white
              border border-red-400/60 shadow-lg shadow-red-500/40"
          >
            ⚔️ CONTRE
          </motion.button>
        )}
      </AnimatePresence>
      {!canContre && isContrableSoon && cooldownRemaining > 0 && (
        <div className="w-full px-2 py-0.5 rounded-lg text-[0.55rem] font-bold text-center bg-white/5 text-white/40">
          ⏳ {(cooldownRemaining / 1000).toFixed(1)}s
        </div>
      )}
    </motion.div>
  );
}
