// ============================================================
// Up and Down – Professional Opponent Seat
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
  'from-slate-600 to-slate-700',
  'from-slate-700 to-slate-800',
  'from-slate-600 to-slate-700',
  'from-slate-700 to-slate-800',
  'from-slate-600 to-slate-700',
  'from-slate-700 to-slate-800',
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
    !opponent.isBot === false &&
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
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: eliminated ? 0.4 : 1, y: 0 }}
      className={`relative flex flex-col items-center gap-2 min-w-[4.5rem] max-w-[7rem]
        px-2.5 py-2.5 rounded-xl border backdrop-blur-sm transition-all
        ${isActive
          ? 'border-amber-400/60 bg-amber-400/10 shadow-lg shadow-amber-400/20'
          : 'border-white/5 bg-black/20'
        }
        ${!opponent.isConnected ? 'opacity-40' : ''}
      `}
    >
      {/* Active glow */}
      {isActive && (
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -inset-0.5 rounded-xl bg-amber-400/15 blur-sm -z-10 pointer-events-none"
        />
      )}

      {/* Avatar circle */}
      <div className="relative">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[colorIndex]}
          flex items-center justify-center text-white font-black text-base shadow-md border-2
          ${isActive ? 'border-amber-400/60' : 'border-white/10'}
          ${isSpeaking && !isMutedPeer ? 'ring-2 ring-green-400' : ''}`}
        >
          {opponent.isBot ? '🤖' : opponent.name[0]?.toUpperCase()}
        </div>
        {isSpeaking && !isMutedPeer && !opponent.isBot && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-green-400 pointer-events-none"
            animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        )}
      </div>

      {/* Player name */}
      <span className="text-xs font-bold text-white/90 truncate max-w-[6rem] text-center leading-tight">
        {opponent.name}
      </span>

      {/* Card count badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-[0.7rem] font-bold text-white/60">
          {opponent.hand.length} 🃏
        </span>
        {/* Voice mute */}
        {!opponent.isBot && voiceConnected && (
          <button
            onClick={() => togglePeerMuted(opponent.id)}
            className={`w-5 h-5 rounded-full text-[0.6rem] flex items-center justify-center transition
              ${isMutedPeer ? 'bg-red-500/30 text-red-300' : 'bg-white/5 text-white/40 hover:bg-white/15'}`}
            title={isMutedPeer ? 'Réactiver ce joueur' : 'Couper ce joueur'}
          >
            {isMutedPeer ? '🔇' : '🔊'}
          </button>
        )}
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {opponent.hasAnnouncedUpDown && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-1.5 py-0.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[0.55rem] font-black rounded-md shadow-md"
          >
            U&D
          </motion.span>
        )}
        {eliminated && (
          <span className="px-1.5 py-0.5 bg-white/10 text-white/70 text-[0.55rem] font-black rounded-md">
            #{opponent.finishOrder}
          </span>
        )}
        {!eliminated && opponent.isBot && (
          <span className="px-1.5 py-0.5 bg-slate-700/50 text-slate-300 text-[0.55rem] font-black rounded-md">
            BOT
          </span>
        )}
      </div>

      {/* Contre button */}
      <AnimatePresence>
        {canContre && (
          <motion.button
            initial={{ scale: 0, y: 8 }}
            animate={{ scale: [1, 1.05, 1], y: 0 }}
            exit={{ scale: 0 }}
            transition={{ repeat: Infinity, duration: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContre}
            className="w-full px-2 py-1 rounded-lg font-black text-[0.65rem]
              bg-gradient-to-r from-red-600 to-rose-700 text-white
              border border-red-400/50 shadow-lg shadow-red-500/30"
          >
            ⚔️ CONTRE
          </motion.button>
        )}
      </AnimatePresence>
      {!canContre && isContrableSoon && cooldownRemaining > 0 && (
        <div className="w-full px-2 py-0.5 rounded-lg text-[0.6rem] font-bold text-center bg-white/5 text-white/40">
          {(cooldownRemaining / 1000).toFixed(1)}s
        </div>
      )}
    </motion.div>
  );
}
