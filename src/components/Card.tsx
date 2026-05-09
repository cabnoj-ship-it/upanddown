// ============================================================
// Up and Down – Professional Poker Card
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

// Professional card corner value size
const CORNER_SIZE = {
  sm: 'text-[0.5rem]',
  md: 'text-[0.65rem] sm:text-xs',
  lg: 'text-sm',
};

// Professional center value size
const CENTER_SIZE = {
  sm: 'text-2xl',
  md: 'text-3xl sm:text-4xl',
  lg: 'text-5xl',
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
    if (isHidden) {
      return {
        bg: 'from-slate-700 via-slate-800 to-slate-900',
        border: 'border-slate-600',
        glow: '',
        text: 'text-slate-400',
      };
    }
    if (card.type === 'UP') return SPECIAL_COLORS.UP;
    if (card.type === 'DOWN') return SPECIAL_COLORS.DOWN;
    return VALUE_COLORS[card.value ?? 0] ?? VALUE_COLORS[0];
  };

  const colors = getColors();
  const sizeClass = SIZE_CLASSES[size];
  const cornerClass = CORNER_SIZE[size];
  const centerClass = CENTER_SIZE[size];

  const displayValue = isHidden
    ? ''
    : card.type === 'UP'
    ? '▲'
    : card.type === 'DOWN'
    ? '▼'
    : card.value?.toString() ?? '';

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
      whileHover={!disabled ? { y: -8, scale: 1.05, zIndex: 50 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.02 }}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`
        relative ${sizeClass} rounded-xl
        bg-gradient-to-br ${colors.bg}
        border-2 ${highlight ? 'border-yellow-400 ring-2 ring-yellow-400/50' : colors.border}
        shadow-xl ${highlight ? 'shadow-yellow-400/40' : colors.glow}
        flex flex-col items-center justify-center
        font-bold text-white
        ${!disabled ? 'cursor-pointer hover:shadow-2xl' : 'cursor-default opacity-60'}
        overflow-hidden select-none
        transition-all duration-200
      `}
      style={style}
    >
      {/* Professional card shine */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: isHidden
            ? `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.03) 4px, rgba(255,255,255,0.03) 5px)`
            : `linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 45%, transparent 55%, rgba(255,255,255,0.06) 100%)`,
        }}
      />

      {/* Top-left corner value */}
      {!isHidden && (
        <div className="absolute top-1 left-1.5 flex flex-col items-center leading-tight">
          <span className={`${cornerClass} font-black text-white/90`}>{displayValue}</span>
          {displayLabel && (
            <span className="text-[0.35rem] sm:text-[0.4rem] font-black text-white/80 uppercase tracking-wider">
              {displayLabel}
            </span>
          )}
        </div>
      )}

      {/* Bottom-right corner value (rotated 180) */}
      {!isHidden && (
        <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-tight rotate-180">
          <span className={`${cornerClass} font-black text-white/90`}>{displayValue}</span>
          {displayLabel && (
            <span className="text-[0.35rem] sm:text-[0.4rem] font-black text-white/80 uppercase tracking-wider">
              {displayLabel}
            </span>
          )}
        </div>
      )}

      {/* Center value - large and prominent */}
      {!isHidden && (
        <span
          className={`relative z-10 font-black drop-shadow-lg leading-none ${centerClass}`}
          style={{
            textShadow: '0 3px 12px rgba(0,0,0,0.4)',
          }}
        >
          {displayValue}
        </span>
      )}

      {/* Center label for special cards */}
      {displayLabel && !isHidden && (
        <span className="relative z-10 text-[0.5rem] sm:text-[0.65rem] font-black tracking-[0.2em] uppercase text-white/90 mt-0.5">
          {displayLabel}
        </span>
      )}

      {/* Professional card back pattern */}
      {isHidden && (
        <div className="absolute inset-1.5 rounded-lg border border-slate-500/30 flex items-center justify-center bg-slate-800/50">
          <div className="w-8 h-8 rounded-full border-2 border-slate-500/40 flex items-center justify-center bg-slate-700/50">
            <span className={`${cornerClass} font-black text-slate-400`}>U&D</span>
          </div>
        </div>
      )}

      {/* Highlight pulse for playable cards */}
      {highlight && !disabled && (
        <motion.div
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 rounded-xl bg-yellow-300/20 pointer-events-none"
        />
      )}
    </motion.button>
  );
}
