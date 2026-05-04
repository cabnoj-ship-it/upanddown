// ============================================================
// Up and Down – Center Pile + Draw Pile Display (UNO-style)
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import type { GameState } from '@/lib/types';

interface CenterPileProps {
  gameState: GameState;
  onDraw?: () => void;
  canDraw?: boolean;
}

export default function CenterPile({ gameState, onDraw, canDraw = false }: CenterPileProps) {
  const topCard =
    gameState.centerPile.length > 0
      ? gameState.centerPile[gameState.centerPile.length - 1]
      : null;

  const isUp = gameState.currentMode === 'UP';
  const deckCount = gameState.deckCount ?? gameState.deck.length;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Mode BIG badge (the star of the show, UNO-style color wheel) */}
      <motion.div
        key={gameState.currentMode}
        initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className={`
          relative px-6 py-2 rounded-full font-black text-lg md:text-xl tracking-widest uppercase
          border-2 shadow-2xl
          ${isUp
            ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-600 border-rose-200/60 text-white shadow-rose-500/50'
            : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 border-cyan-200/60 text-white shadow-cyan-500/50'
          }
        `}
      >
        <motion.span
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="inline-block mr-2"
        >
          {isUp ? '▲' : '▼'}
        </motion.span>
        {isUp ? 'UP' : 'DOWN'}
        {/* Direction micro-indicator */}
        <motion.span
          animate={{ rotate: gameState.direction === 'CLOCKWISE' ? 360 : -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="ml-2 text-sm opacity-70 inline-block"
        >
          {gameState.direction === 'CLOCKWISE' ? '↻' : '↺'}
        </motion.span>
      </motion.div>

      {/* Cards row: Draw pile + Discard pile (BIGGER on all screens) */}
      <div className="flex items-center gap-4 sm:gap-6 md:gap-10">
        {/* Draw pile (Pioche) */}
        <motion.button
          whileHover={canDraw ? { scale: 1.06, y: -3 } : undefined}
          whileTap={canDraw ? { scale: 0.94 } : undefined}
          onClick={canDraw ? onDraw : undefined}
          disabled={!canDraw}
          className={`relative flex flex-col items-center gap-1.5 ${canDraw ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="relative w-[4.5rem] h-[6.5rem] sm:w-[5.5rem] sm:h-[8rem]">
            {/* Stacked deck look (depth) */}
            {deckCount > 2 && (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-900 rounded-2xl border border-violet-500/30 translate-x-1.5 translate-y-1.5" />
            )}
            {deckCount > 1 && (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-900 rounded-2xl border border-violet-500/30 translate-x-0.5 translate-y-0.5" />
            )}
            {deckCount > 0 ? (
              <div className={`absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-900
                rounded-2xl border-2 flex items-center justify-center overflow-hidden
                ${canDraw ? 'border-yellow-300/80 shadow-2xl shadow-yellow-400/30' : 'border-violet-500/30'}
                transition-all`}
              >
                <div className="absolute inset-2 rounded-xl border border-violet-400/25 flex items-center justify-center">
                  <span className="text-violet-200/70 text-xs sm:text-sm font-black tracking-wider">U&D</span>
                </div>
                {canDraw && (
                  <>
                    <motion.div
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="absolute inset-0 rounded-2xl bg-yellow-300/15 pointer-events-none"
                    />
                    <motion.div
                      animate={{ y: [-3, 3, -3] }}
                      transition={{ repeat: Infinity, duration: 1.6 }}
                      className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-yellow-300 text-lg"
                    >
                      👆
                    </motion.div>
                  </>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center">
                <span className="text-white/20 text-xs font-bold">Vide</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white/80 text-[0.65rem] font-black uppercase tracking-wider">Pioche</span>
            <span className="text-white/50 text-[0.65rem] font-bold">{deckCount}</span>
          </div>
        </motion.button>

        {/* Center discard pile */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative w-[4.5rem] h-[6.5rem] sm:w-[5.5rem] sm:h-[8rem]">
            {/* Glow behind pile (mode color) */}
            {topCard && (
              <motion.div
                animate={{ opacity: [0.35, 0.6, 0.35] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`absolute inset-0 rounded-3xl blur-2xl
                  ${isUp ? 'bg-rose-500' : 'bg-cyan-500'}`}
                style={{ transform: 'scale(1.5)' }}
              />
            )}

            {/* Shadow stack for depth */}
            {gameState.centerPile.length > 1 && (
              <div className="absolute inset-0 bg-black/20 rounded-2xl translate-x-0.5 translate-y-0.5" />
            )}

            {/* Top card */}
            <AnimatePresence mode="popLayout">
              {topCard ? (
                <motion.div
                  key={topCard.id}
                  initial={{ scale: 0.3, y: -100, rotateZ: -20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, rotateZ: 0, opacity: 1 }}
                  exit={{ scale: 0.5, y: 40, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Card card={topCard} size="md" disabled />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-2xl border-2 border-dashed border-yellow-300/30 flex items-center justify-center"
                >
                  <span className="text-yellow-300/40 text-[0.65rem] font-bold">Pose ici</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="text-white/80 text-[0.65rem] font-black uppercase tracking-wider">
            Pile
          </span>
        </div>
      </div>

      {/* Turn counter (small, non-intrusive) */}
      <div className="text-white/30 text-[0.6rem] font-bold tracking-wider">
        TOUR {gameState.turnNumber ?? 1}
      </div>
    </div>
  );
}
