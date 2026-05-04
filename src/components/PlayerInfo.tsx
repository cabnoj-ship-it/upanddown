// ============================================================
// Up and Down – Player Info Display (Vibrant)
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Player, GameState } from '@/lib/types';

const AVATAR_COLORS = [
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-fuchsia-500 to-pink-600',
];

interface PlayerInfoProps {
  player: Player;
  isActive: boolean;
  isMe: boolean;
  onContre?: () => void;
  showContre?: boolean;
  gameState?: GameState;
}

export default function PlayerInfo({
  player,
  isActive,
  isMe,
  onContre,
  showContre = false,
  gameState,
}: PlayerInfoProps) {
  // Tick to make Date.now() reactive (cooldown)
  const [, setTick] = useState(0);
  useEffect(() => {
    const cooldownUntil = gameState?.contreCooldownUntil ?? 0;
    if (Date.now() >= cooldownUntil) return;
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [gameState?.contreCooldownUntil]);

  const cooldownRemaining = Math.max(0, (gameState?.contreCooldownUntil ?? 0) - Date.now());
  const canContre =
    showContre &&
    !isMe &&
    player.hand.length === 2 && // STRICT: exactly 2 cards
    !player.hasAnnouncedUpDown &&
    gameState?.enableAnnounce !== false &&
    cooldownRemaining === 0;
  const isContrableSoon =
    showContre &&
    !isMe &&
    player.hand.length === 2 &&
    !player.hasAnnouncedUpDown &&
    gameState?.enableAnnounce !== false;

  const colorIndex = player.name.charCodeAt(0) % AVATAR_COLORS.length;

  return (
    <motion.div
      layout
      className={`
        relative flex items-center gap-2 px-3 py-2 rounded-2xl
        border backdrop-blur transition-all duration-300
        ${isActive
          ? 'border-emerald-400/50 bg-emerald-400/10 shadow-lg shadow-emerald-400/15'
          : 'border-white/10 bg-white/5'
        }
        ${!player.isConnected ? 'opacity-40' : ''}
      `}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[colorIndex]}
        flex items-center justify-center text-white font-black text-xs shadow-md
        ${isActive ? 'ring-2 ring-emerald-400/50' : ''}`}
      >
        {player.isBot ? '🤖' : player.name[0]?.toUpperCase()}
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold truncate ${isMe ? 'text-white' : 'text-white/70'}`}>
            {player.name}
          </span>
          {isMe && (
            <span className="text-[0.5rem] text-violet-400 font-bold">(Vous)</span>
          )}
          {player.isBot && (
            <span className="text-[0.5rem] bg-violet-500/20 text-violet-300 px-1 py-0.5 rounded font-bold">
              BOT
            </span>
          )}
        </div>
        <span className="text-[0.6rem] text-white/30 font-medium">
          {player.hand.length} carte{player.hand.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Announced badge */}
      {player.hasAnnouncedUpDown && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto px-2 py-0.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[0.55rem] font-black rounded-lg
            shadow-md shadow-rose-500/20"
        >
          U&D!
        </motion.span>
      )}

      {/* Contre cooldown indicator */}
      {isContrableSoon && cooldownRemaining > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto px-2 py-1 bg-white/5 border border-white/10 rounded-xl text-[0.55rem] font-black text-white/40"
          title="Attente avant de pouvoir contrer"
        >
          ⏳ {(cooldownRemaining / 1000).toFixed(1)}s
        </motion.div>
      )}

      {/* Contre button */}
      {canContre && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={onContre}
          className="ml-auto px-2.5 py-1 bg-gradient-to-r from-red-600 to-rose-700 text-white text-[0.6rem] font-black rounded-xl
            border border-red-400/60 shadow-lg shadow-red-500/40
            hover:shadow-red-500/60 transition-all"
        >
          ⚔️ CONTRE
        </motion.button>
      )}
    </motion.div>
  );
}
