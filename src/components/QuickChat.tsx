// ============================================================
// Up and Down – Quick Chat (Pre-defined messages)
// ============================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_MESSAGES = [
  'Bien joué !',
  'Oups…',
  'GG !',
  'Bonne chance',
  'Attends…',
  'Yesss !',
  '😈',
  '🍀',
  'Bientôt fini !',
  'Nooooon !',
];

interface QuickChatProps {
  onSend: (msg: string) => void;
}

export default function QuickChat({ onSend }: QuickChatProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full flex items-center justify-center
          bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur text-sm"
        title="Chat rapide"
      >
        💬
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-12 right-0 z-50 w-56 p-3 rounded-2xl
              bg-[#13102a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl"
          >
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_MESSAGES.map((msg) => (
                <motion.button
                  key={msg}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { onSend(msg); setOpen(false); }}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/5
                    text-white/70 text-xs font-semibold hover:bg-white/10 hover:text-white
                    transition-all text-left truncate"
                >
                  {msg}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
