// ============================================================
// Up and Down – Visual Effects (Confetti & Explosions)
// ============================================================

'use client';

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

export function triggerWinConfetti() {
  const end = Date.now() + 3000;
  const colors = ['#a855f7', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function triggerClosureBurst(x: number, y: number) {
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { x, y },
    colors: ['#fbbf24', '#f59e0b', '#ef4444', '#a855f7'],
    gravity: 1.2,
    scalar: 1.2,
    shapes: ['circle', 'square'],
    disableForReducedMotion: true,
  });
}

export function triggerCardPlay(x: number, y: number) {
  confetti({
    particleCount: 12,
    spread: 40,
    origin: { x, y },
    colors: ['#ffffff'],
    gravity: 0.8,
    scalar: 0.8,
    ticks: 40,
    disableForReducedMotion: true,
  });
}

export default function VFX() {
  // No render — effects are triggered imperatively
  return null;
}
