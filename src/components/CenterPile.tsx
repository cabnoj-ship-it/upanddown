// ============================================================
// Up and Down – Center Pile + Draw Pile Display (Vibrant)
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
    <div className="flex flex-col items-center gap-2">
      {/* Mode + Direction + Turn row */}
      <div className="flex items-center gap-2">
        {/* Turn counter */}
        <div className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white/30 text-[0.6rem] font-bold">
          Tour {gameState.turnNumber ?? 1}
        </div>

        {/* Mode badge */}
        <motion.div
          key={gameState.currentMode}
          initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className={`
            px-4 py-1.5 rounded-2xl font-black text-xs tracking-widest uppercase
            border shadow-xl
            ${isUp
              ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-600 border-rose-300/40 text-white shadow-rose-500/30'
              : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 border-cyan-300/40 text-white shadow-cyan-500/30'
            }
          `}
        >
          {isUp ? '▲ UP' : '▼ DOWN'}
        </motion.div>

        {/* Direction arrow */}
        <motion.div
          key={gameState.direction}
          initial={{ rotate: gameState.direction === 'CLOCKWISE' ? -180 : 180, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border
            ${gameState.direction === 'CLOCKWISE'
              ? 'bg-emerald-500/10 border-emerald-400/20'
              : 'bg-amber-500/10 border-amber-400/20'
            }`}
        >
          <motion.span
            animate={{ rotate: gameState.direction === 'CLOCKWISE' ? [0, 360] : [0, -360] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className={`text-sm ${gameState.direction === 'CLOCKWISE' ? 'text-emerald-400' : 'text-amber-400'}`}
          >
            {gameState.direction === 'CLOCKWISE' ? '↻' : '↺'}
          </motion.span>
          <span className={`text-[0.55rem] font-bold ${gameState.direction === 'CLOCKWISE' ? 'text-emerald-400/60' : 'text-amber-400/60'}`}>
            {gameState.direction === 'CLOCKWISE' ? 'Horaire' : 'Anti-hor.'}
          </span>
        </motion.div>
      </div>

      {/* Cards row: Draw pile + Center pile */}
      <div className="flex items-center gap-5 md:gap-8">
        {/* Draw pile (Pioche) */}
        <motion.button
          whileHover={canDraw ? { scale: 1.06 } : undefined}
          whileTap={canDraw ? { scale: 0.94 } : undefined}
          onClick={canDraw ? onDraw : undefined}
          disabled={!canDraw}
          className={`relative flex flex-col items-center gap-1 ${canDraw ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="relative w-16 h-24 md:w-18 md:h-28">
            {/* Stacked deck look */}
            {deckCount > 2 && (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-900 rounded-2xl border border-violet-500/30 translate-x-1 translate-y-1" />
            )}
            {deckCount > 1 && (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-900 rounded-2xl border border-violet-500/30 translate-x-0.5 translate-y-0.5" />
            )}
            {deckCount > 0 ? (
              <div className={`absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-900
                rounded-2xl border-2 flex items-center justify-center
                ${canDraw ? 'border-violet-400/60 shadow-lg shadow-violet-500/30' : 'border-violet-500/30'}
                transition-all`}
              >
                <div className="absolute inset-1.5 rounded-xl border border-violet-400/15 flex items-center justify-center">
                  <span className="text-violet-300/50 text-[0.5rem] font-black">U&D</span>
                </div>
                {canDraw && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 rounded-2xl bg-violet-400/10 pointer-events-none"
                  />
                )}
              </div>
            ) : (
              <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center">
                <span className="text-white/15 text-[0.6rem] font-bold">Vide</span>
              </div>
            )}
          </div>
          <span className="text-white/40 text-[0.6rem] font-black">Pioche</span>
          <span className="text-white/25 text-[0.55rem] font-bold">{deckCount} cartes</span>
        </motion.button>

        {/* Center pile */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-16 h-24 md:w-18 md:h-28">
            {/* Glow behind pile */}
            {topCard && (
              <div className={`absolute inset-0 rounded-2xl blur-xl opacity-30
                ${isUp ? 'bg-rose-500' : 'bg-cyan-500'}`}
                style={{ transform: 'scale(1.3)' }}
              />
            )}

            {/* Shadow stack */}
            {gameState.centerPile.length > 1 && (
              <>
                <div className="absolute inset-0 bg-white/5 rounded-2xl translate-x-0.5 translate-y-0.5" />
              </>
            )}

            {/* Top card */}
            <AnimatePresence mode="popLayout">
              {topCard ? (
                <motion.div
                  key={topCard.id}
                  initial={{ scale: 0.3, y: -80, rotateZ: -15 }}
                  animate={{ scale: 1, y: 0, rotateZ: 0 }}
                  exit={{ scale: 0.5, y: 30, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Card card={topCard} size="md" disabled />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/15 flex items-center justify-center"
                >
                  <span className="text-white/20 text-[0.6rem] font-bold">Vide</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="text-white/30 text-[0.6rem] font-bold">
            Pile {gameState.centerPile.length}
          </span>
        </div>
      </div>
    </div>
  );
}
