// ============================================================
// Up and Down – Action Toast (floating notifications)
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'contre' | 'announce' | 'closure' | 'win';
}

let counter = 0;

interface Props {
  lastAction: string | null;
}

function classify(text: string): Toast['kind'] {
  const lower = text.toLowerCase();
  if (lower.includes('contre')) return 'contre';
  if (lower.includes('up and down')) return 'announce';
  if (lower.includes('ferme')) return 'closure';
  if (lower.includes('terminée') || lower.includes('débarrasse')) return 'win';
  return 'info';
}

const STYLES: Record<Toast['kind'], string> = {
  info: 'from-white/20 to-white/10 border-white/20 text-white',
  contre: 'from-red-500/80 to-rose-700/80 border-red-400/60 text-white shadow-red-500/30',
  announce: 'from-fuchsia-500/80 to-pink-600/80 border-fuchsia-400/60 text-white shadow-fuchsia-500/30',
  closure: 'from-cyan-500/80 to-blue-600/80 border-cyan-400/60 text-white shadow-cyan-500/30',
  win: 'from-amber-500/80 to-orange-600/80 border-amber-400/60 text-white shadow-amber-500/30',
};

const ICONS: Record<Toast['kind'], string> = {
  info: '💬',
  contre: '⚔️',
  announce: '🚀',
  closure: '🔒',
  win: '🏆',
};

export default function ActionToast({ lastAction }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!lastAction) return;
    const kind = classify(lastAction);
    // Only show notable actions
    if (kind === 'info') return;

    const id = ++counter;
    setToasts((prev) => [...prev, { id, text: lastAction, kind }]);
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
    return () => clearTimeout(t);
  }, [lastAction]);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`
              px-4 py-2 rounded-2xl font-bold text-sm
              bg-gradient-to-r ${STYLES[toast.kind]}
              border backdrop-blur-xl shadow-xl
              flex items-center gap-2 max-w-sm
            `}
          >
            <span className="text-lg">{ICONS[toast.kind]}</span>
            <span>{toast.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
