// ============================================================
// Up and Down – Card Component (Vibrant & Colorful)
// ============================================================

'use client';

import { motion } from 'framer-motion';
import type { Card as CardType } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { VALUE_COLORS as ALL_VALUE_COLORS, SPECIAL_COLORS as ALL_SPECIAL_COLORS } from '@/lib/themes';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  highlight?: boolean;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  index?: number;
}

const SIZE_CLASSES = {
  sm: 'w-12 h-[4.5rem] text-xs',
  md: 'w-[4.5rem] h-[6.5rem] sm:w-20 sm:h-28 text-lg',
  lg: 'w-24 h-36 text-2xl',
};

export default function Card({
  card,
  onClick,
  disabled = false,
  highlight = false,
  faceDown = false,
  size = 'md',
  style,
  index = 0,
}: CardProps) {
  const cardTheme = useAppStore((s) => s.cardTheme);
  const isHidden = card.id === 'hidden' || faceDown;

  const VALUE_COLORS = ALL_VALUE_COLORS[cardTheme];
  const SPECIAL_COLORS = ALL_SPECIAL_COLORS[cardTheme];

  const getColors = () => {
    if (isHidden) return { bg: 'from-violet-800 via-purple-900 to-indigo-950', border: 'border-violet-500/40', glow: '' };
    if (card.type === 'UP') return SPECIAL_COLORS.UP;
    if (card.type === 'DOWN') return SPECIAL_COLORS.DOWN;
    return VALUE_COLORS[card.value ?? 0] ?? VALUE_COLORS[0];
  };

  const colors = getColors();
  const sizeClass = SIZE_CLASSES[size];

  const displayValue = isHidden
    ? '?'
    : card.type === 'UP'
    ? '▲'
    : card.type === 'DOWN'
    ? '▼'
    : card.value?.toString() ?? '?';

  const displayLabel = isHidden
    ? ''
    : card.type === 'UP'
    ? 'UP'
    : card.type === 'DOWN'
    ? 'DOWN'
    : '';

  return (
    <motion.button
      layout
      initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      exit={{ scale: 0.5, opacity: 0, y: -60 }}
      whileHover={!disabled ? { y: -14, scale: 1.12, zIndex: 50 } : undefined}
      whileTap={!disabled ? { scale: 0.92 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.03 }}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`
        relative ${sizeClass} rounded-2xl
        bg-gradient-to-br ${colors.bg}
        border-2 ${highlight ? 'border-yellow-300 ring-2 ring-yellow-300/60' : colors.border}
        shadow-lg ${highlight ? 'shadow-yellow-300/40' : colors.glow}
        flex flex-col items-center justify-center gap-0.5
        font-bold text-white
        ${!disabled ? 'cursor-pointer hover:shadow-2xl' : 'cursor-default opacity-70'}
        overflow-hidden select-none
        transition-shadow duration-200
      `}
      style={style}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: isHidden
            ? `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 5px)`
            : `linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.08) 100%)`,
        }}
      />

      {/* Top-left value (mini) */}
      {!isHidden && (
        <span className="absolute top-1 left-1.5 text-[0.5rem] font-black text-white/60 leading-none">
          {displayValue}
        </span>
      )}

      {/* Center value */}
      <span className="relative z-10 font-black drop-shadow-lg leading-none"
        style={{
          fontSize: size === 'lg' ? '2rem' : size === 'md' ? '1.4rem' : '0.9rem',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {displayValue}
      </span>

      {/* Label for special cards */}
      {displayLabel && (
        <span className="relative z-10 text-[0.45rem] font-black tracking-[0.15em] uppercase text-white/80">
          {displayLabel}
        </span>
      )}

      {/* Bottom-right value (mini) */}
      {!isHidden && (
        <span className="absolute bottom-1 right-1.5 text-[0.5rem] font-black text-white/60 leading-none rotate-180">
          {displayValue}
        </span>
      )}

      {/* Back pattern for hidden cards */}
      {isHidden && (
        <div className="absolute inset-1.5 rounded-xl border border-violet-400/20 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-violet-400/30 flex items-center justify-center">
            <span className="text-violet-300/40 text-[0.5rem] font-black">U&D</span>
          </div>
        </div>
      )}

      {/* Highlight pulse */}
      {highlight && (
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="absolute inset-0 rounded-2xl bg-yellow-300/20 pointer-events-none"
        />
      )}
    </motion.button>
  );
}
