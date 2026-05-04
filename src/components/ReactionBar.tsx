// ============================================================
// Up and Down – Reaction Emoji Bar + Floating Reactions
// ============================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

const REACTION_EMOJIS = ['😂', '😭', '🔥', '👏', '😱', '💀'];

interface ReactionBarProps {
  onReact: (emoji: string) => void;
}

export function ReactionBar({ onReact }: ReactionBarProps) {
  const [open, setOpen] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const handleReact = (emoji: string) => {
    if (cooldown) return;
    onReact(emoji);
    setCooldown(true);
    setOpen(false);
    setTimeout(() => setCooldown(false), 2000);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-lg
          transition-all border
          ${open
            ? 'bg-violet-500/20 border-violet-400/40'
            : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
      >
        😊
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-12 right-0 flex gap-1.5 px-2.5 py-2 rounded-2xl
              bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl"
          >
            {REACTION_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => handleReact(emoji)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl
                  hover:bg-white/10 transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FloatingReactions() {
  const reactions = useAppStore((s) => s.reactions);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 0, x: '-50%', scale: 0.5 }}
            animate={{ opacity: 1, y: -120, scale: 1.2 }}
            exit={{ opacity: 0, y: -200, scale: 0.3 }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            className="absolute left-1/2 bottom-1/3 flex flex-col items-center gap-0.5"
          >
            <span className="text-4xl drop-shadow-lg">{r.emoji}</span>
            <span className="text-[0.55rem] font-bold text-white/60 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {r.playerName}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
