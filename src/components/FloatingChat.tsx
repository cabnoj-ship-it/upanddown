// ============================================================
// Up and Down – Floating Chat Messages
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

export default function FloatingChat() {
  const chatMessages = useAppStore((s) => s.chatMessages);

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      <AnimatePresence>
        {chatMessages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ChatBubble({ msg }: { msg: { id: string; playerId: string; message: string } }) {
  const gameState = useAppStore((s) => s.gameState);
  const playerIdx = gameState?.players.findIndex((p) => p.id === msg.playerId);
  const isMe = useAppStore((s) => s.playerId) === msg.playerId;

  if (playerIdx === undefined || playerIdx < 0) return null;

  // Position roughly over the player's area
  const total = gameState?.players.length ?? 1;
  const angle = (360 / total) * playerIdx - 90;
  const radius = 35;
  const x = 50 + Math.cos((angle * Math.PI) / 180) * radius;
  const y = 50 + Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`
        px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap shadow-lg
        ${isMe
          ? 'bg-violet-600/80 text-white border border-violet-400/30'
          : 'bg-white/10 text-white/90 border border-white/10 backdrop-blur'
        }
      `}>
        {msg.message}
      </div>
      <div className={`w-2 h-2 mx-auto -mt-0.5 rotate-45 ${isMe ? 'bg-violet-600/80' : 'bg-white/10'}`} />
    </motion.div>
  );
}
