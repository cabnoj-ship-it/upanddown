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
  // Wider fan for nicer UNO look
  const maxFanAngle = Math.min(cardCount * 5, 55);
  const fanStep = cardCount > 1 ? maxFanAngle / (cardCount - 1) : 0;
  const startAngle = -maxFanAngle / 2;
  // Adapt overlap to card count (prevent cards going off-screen)
  const overlapRem = cardCount > 9 ? -1.4 : cardCount > 7 ? -1.1 : cardCount > 5 ? -0.7 : -0.3;
  // Size: md on desktop, md on mobile too (better readability), sm if too many cards
  const cardSize = cardCount > 10 ? 'sm' : 'md';

  return (
    <div className="relative flex items-end justify-center w-full h-[130px] sm:h-[150px] pt-6 overflow-visible">
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => {
          const playable = isMyTurn && isValidPlay(gameState, card);
          const angle = startAngle + fanStep * i;
          const yOffset = Math.abs(angle) * 0.6; // More arc curvature

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ scale: 0.3, y: -120, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.4, y: -160, opacity: 0, rotate: -10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative origin-bottom"
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
                size={cardSize}
                index={i}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
