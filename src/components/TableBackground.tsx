// ============================================================
// Up and Down – Professional Casino Felt Table
// ============================================================

'use client';

/**
 * Casino-grade green felt table with:
 * - Realistic felt texture (noise)
 * - Golden border trim
 * - Subtle lighting vignette
 * - Professional depth
 */
export default function TableBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base green felt - casino grade */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, #1a5c3a 0%, #145a32 30%, #0d4a2a 60%, #073a1e 85%, #042815 100%)
          `,
        }}
      />

      {/* Felt texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='felt'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23felt)'/%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px',
        }}
      />

      {/* Golden border trim (inner) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-[2px] rounded-[1rem] border-4"
          style={{
            borderColor: 'rgba(212, 175, 55, 0.4)',
            boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.3)',
          }}
        />
      </div>

      {/* Golden border trim (outer glow) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-[1px] rounded-[1.1rem] border-[6px] opacity-30"
          style={{
            borderColor: 'rgba(212, 175, 55, 0.3)',
            boxShadow: '0 0 60px rgba(212, 175, 55, 0.15)',
          }}
        />
      </div>

      {/* Center spotlight for play area */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]"
        style={{
          width: '70vmin',
          height: '70vmin',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)',
        }}
      />

      {/* Professional edge vignette for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5) 95%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Subtle corner ambient light (warm casino lighting) */}
      <div
        className="absolute -top-32 -left-32 w-[50vmin] h-[50vmin] rounded-full blur-[120px] opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #fbbf24, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[50vmin] h-[50vmin] rounded-full blur-[120px] opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }}
      />
    </div>
  );
}
