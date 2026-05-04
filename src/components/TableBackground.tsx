// ============================================================
// Up and Down – Table Background (UNO-inspired felt)
// ============================================================

'use client';

import { motion } from 'framer-motion';

/**
 * Felt table style inspired by UNO / Poker.
 * Radial gradient center (lighter) → dark edges, with subtle pattern overlay.
 */
export default function TableBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base felt gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, #1e4731 0%, #123122 40%, #0a1e14 80%, #05110b 100%)',
        }}
      />

      {/* Subtle felt texture */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Center soft spotlight (where pile sits) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] opacity-40"
        style={{
          width: '60vmin',
          height: '60vmin',
          background: 'radial-gradient(circle, rgba(250,230,100,0.4) 0%, transparent 70%)',
        }}
      />

      {/* Vibrant corner halos (UNO-style colors) */}
      <motion.div
        animate={{ opacity: [0.25, 0.4, 0.25] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        className="absolute -top-24 -left-24 w-[40vmin] h-[40vmin] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, #e11d48, transparent 65%)' }}
      />
      <motion.div
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ repeat: Infinity, duration: 7, delay: 1, ease: 'easeInOut' }}
        className="absolute -top-20 -right-24 w-[45vmin] h-[45vmin] rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent 65%)' }}
      />
      <motion.div
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ repeat: Infinity, duration: 8, delay: 2, ease: 'easeInOut' }}
        className="absolute -bottom-24 left-1/3 w-[50vmin] h-[50vmin] rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(circle, #ca8a04, transparent 65%)' }}
      />

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />
    </div>
  );
}
