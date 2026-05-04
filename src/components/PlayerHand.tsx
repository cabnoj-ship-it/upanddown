// ============================================================
// Up and Down – Player Hand (Fan layout, viewport-safe)
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import type { Card as CardType, GameState } from '@/lib/types';
import { isValidPlay } from '@/lib/gameLogic';

interface PlayerHandProps {
  cards: CardType[];
  gameState: GameState;
  isMyTurn: boolean;
  onPlayCard: (cardId: string) => void;
}

export default function PlayerHand({
  cards,
  gameState,
  isMyTurn,
  onPlayCard,
}: PlayerHandProps) {
  const cardCount = cards.length;
  // Tighter fan on mobile, wider on desktop
  const maxFanAngle = Math.min(cardCount * 3.5, 35);
  const fanStep = cardCount > 1 ? maxFanAngle / (cardCount - 1) : 0;
  const startAngle = -maxFanAngle / 2;
  // Tighter overlap when many cards
  const overlapRem = cardCount > 7 ? -0.75 : cardCount > 5 ? -0.6 : -0.4;

  return (
    <div className="relative flex items-end justify-center w-full h-[100px] md:h-[110px]">
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => {
          const playable = isMyTurn && isValidPlay(gameState, card);
          const angle = startAngle + fanStep * i;
          const yOffset = Math.abs(angle) * 0.35;

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ scale: 0.3, y: -120, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.4, y: -160, opacity: 0, rotate: -10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative"
              style={{
                transform: `rotate(${angle}deg) translateY(${yOffset}px)`,
                marginLeft: i === 0 ? 0 : `${overlapRem}rem`,
                zIndex: i,
              }}
            >
              <Card
                card={card}
                onClick={() => onPlayCard(card.id)}
                disabled={!playable}
                highlight={playable}
                size={cardCount > 8 ? 'sm' : 'md'}
                index={i}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
