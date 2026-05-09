// ============================================================
// Up and Down – Professional Center Pile (3D Casino Style)
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
    <div className="flex flex-col items-center gap-4">
      {/* Mode indicator - professional badge */}
      <motion.div
        key={gameState.currentMode}
        initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className={`
          relative px-5 py-2 rounded-full font-black text-base md:text-lg tracking-widest uppercase
          border-2 shadow-2xl backdrop-blur-sm
          ${isUp
            ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-700 border-rose-300/50 text-white shadow-rose-500/40'
            : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 border-cyan-300/50 text-white shadow-cyan-500/40'
          }
        `}
      >
        <motion.span
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="inline-block mr-2"
        >
          {isUp ? '▲' : '▼'}
        </motion.span>
        {isUp ? 'UP' : 'DOWN'}
        {/* Direction indicator */}
        <motion.span
          animate={{ rotate: gameState.direction === 'CLOCKWISE' ? 360 : -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          className="ml-2 text-sm opacity-70 inline-block"
        >
          {gameState.direction === 'CLOCKWISE' ? '↻' : '↺'}
        </motion.span>
      </motion.div>

      {/* Cards row: Draw pile + Discard pile */}
      <div className="flex items-center gap-6 sm:gap-10">
        {/* Draw pile (Pioche) - 3D stack */}
        <motion.button
          whileHover={canDraw ? { scale: 1.04, y: -2 } : undefined}
          whileTap={canDraw ? { scale: 0.96 } : undefined}
          onClick={canDraw ? onDraw : undefined}
          disabled={!canDraw}
          className={`relative flex flex-col items-center gap-1.5 ${canDraw ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="relative w-[5rem] h-[7rem] sm:w-[6rem] sm:h-[8.5rem]">
            {/* 3D stack depth */}
            {deckCount > 2 && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border-2 border-slate-600 translate-x-2 translate-y-2 shadow-lg" />
            )}
            {deckCount > 1 && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border-2 border-slate-600 translate-x-1 translate-y-1 shadow-md" />
            )}
            {deckCount > 0 ? (
              <div className={`absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800
                rounded-xl border-2 flex items-center justify-center overflow-hidden shadow-xl
                ${canDraw ? 'border-amber-400/60 shadow-amber-400/30' : 'border-slate-500'}
                transition-all`}
              >
                {/* Card back pattern */}
                <div className="absolute inset-2 rounded-lg border border-slate-500/30 flex items-center justify-center bg-slate-700/50">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-500/40 flex items-center justify-center bg-slate-600/50">
                    <span className="text-slate-400 text-sm font-black">U&D</span>
                  </div>
                </div>
                {/* Glow when playable */}
                {canDraw && (
                  <>
                    <motion.div
                      animate={{ opacity: [0.15, 0.35, 0.15] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 rounded-xl bg-amber-300/15 pointer-events-none"
                    />
                    <motion.div
                      animate={{ y: [-2, 2, -2] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-amber-300 text-xl"
                    >
                      👆
                    </motion.div>
                  </>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                <span className="text-white/20 text-sm font-bold">Vide</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white/80 text-[0.7rem] font-bold uppercase tracking-wider">Pioche</span>
            <span className="text-white/50 text-[0.7rem] font-bold">{deckCount}</span>
          </div>
        </motion.button>

        {/* Center discard pile - 3D stack */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative w-[5rem] h-[7rem] sm:w-[6rem] sm:h-[8.5rem]">
            {/* Glow behind pile (mode color) */}
            {topCard && (
              <motion.div
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className={`absolute inset-0 rounded-xl blur-2xl
                  ${isUp ? 'bg-rose-500' : 'bg-cyan-500'}`}
                style={{ transform: 'scale(1.4)' }}
              />
            )}

            {/* Shadow stack for 3D depth */}
            {gameState.centerPile.length > 1 && (
              <div className="absolute inset-0 bg-black/30 rounded-xl translate-x-0.5 translate-y-0.5 shadow-lg" />
            )}

            {/* Top card */}
            <AnimatePresence mode="popLayout">
              {topCard ? (
                <motion.div
                  key={topCard.id}
                  initial={{ scale: 0.3, y: -120, rotateZ: -25, opacity: 0 }}
                  animate={{ scale: 1, y: 0, rotateZ: 0, opacity: 1 }}
                  exit={{ scale: 0.5, y: 50, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Card card={topCard} size="md" disabled />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-xl border-2 border-dashed border-amber-300/30 flex items-center justify-center"
                >
                  <span className="text-amber-300/40 text-sm font-bold">Pose ici</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="text-white/80 text-[0.7rem] font-bold uppercase tracking-wider">
            Pile
          </span>
        </div>
      </div>

      {/* Turn counter */}
      <div className="text-white/30 text-[0.65rem] font-bold tracking-wider uppercase">
        Tour {gameState.turnNumber ?? 1}
      </div>
    </div>
  );
}
