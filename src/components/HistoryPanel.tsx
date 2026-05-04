// ============================================================
// Up and Down – History Panel (Vibrant Slide-out)
// ============================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

export default function HistoryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const gameState = useAppStore((s) => s.gameState);

  const history = gameState?.history ?? [];

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 right-3 z-40 w-10 h-10 rounded-full
          flex items-center justify-center
          bg-white/10 backdrop-blur border border-white/20
          text-white/60 hover:text-white hover:bg-white/15
          shadow-lg transition-all text-sm font-bold"
      >
        {isOpen ? '✕' : '📜'}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-72 md:w-80 z-50
                bg-gradient-to-b from-[#1a1040] to-[#0f0c29]
                border-l border-white/10 shadow-2xl backdrop-blur-xl
                flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-black text-sm">Historique</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 hover:text-white text-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {history.length === 0 ? (
                  <p className="text-white/20 text-sm text-center mt-8">
                    Aucune action pour le moment.
                  </p>
                ) : (
                  [...history].reverse().map((action, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/5
                        text-white/60 text-xs"
                    >
                      <span className="text-violet-400 font-bold mr-1">
                        {gameState?.players.find((p) => p.id === action.playerId)?.name ?? '?'}
                      </span>
                      <span className="text-white/30">
                        {action.type.replace(/_/g, ' ')}
                      </span>
                      {action.card && (
                        <span className="ml-1 text-cyan-300 font-mono font-bold">
                          [{action.card.type === 'NUMBER' ? action.card.value : action.card.type}]
                        </span>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
