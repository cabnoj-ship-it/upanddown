// ============================================================
// Up and Down – Card Themes
// ============================================================

export type CardTheme = 'neon' | 'classic' | 'dark';

const NEON: Record<number, { bg: string; border: string; glow: string }> = {
  0:  { bg: 'from-slate-600 via-slate-700 to-slate-900',         border: 'border-slate-400/60',   glow: 'shadow-slate-400/30' },
  1:  { bg: 'from-red-400 via-red-500 to-red-700',               border: 'border-red-300/60',     glow: 'shadow-red-400/40' },
  2:  { bg: 'from-orange-400 via-orange-500 to-orange-700',       border: 'border-orange-300/60',  glow: 'shadow-orange-400/40' },
  3:  { bg: 'from-amber-400 via-amber-500 to-yellow-700',         border: 'border-amber-300/60',   glow: 'shadow-amber-400/40' },
  4:  { bg: 'from-yellow-300 via-yellow-400 to-amber-600',        border: 'border-yellow-200/60',  glow: 'shadow-yellow-400/40' },
  5:  { bg: 'from-lime-400 via-green-500 to-emerald-700',         border: 'border-lime-300/60',    glow: 'shadow-lime-400/40' },
  6:  { bg: 'from-emerald-400 via-emerald-500 to-teal-700',       border: 'border-emerald-300/60', glow: 'shadow-emerald-400/40' },
  7:  { bg: 'from-teal-400 via-teal-500 to-cyan-700',             border: 'border-teal-300/60',    glow: 'shadow-teal-400/40' },
  8:  { bg: 'from-cyan-400 via-cyan-500 to-blue-700',             border: 'border-cyan-300/60',    glow: 'shadow-cyan-400/40' },
  9:  { bg: 'from-blue-400 via-blue-500 to-indigo-700',           border: 'border-blue-300/60',    glow: 'shadow-blue-400/40' },
  10: { bg: 'from-indigo-400 via-indigo-500 to-violet-700',       border: 'border-indigo-300/60',  glow: 'shadow-indigo-400/40' },
  11: { bg: 'from-violet-400 via-purple-500 to-purple-700',       border: 'border-violet-300/60',  glow: 'shadow-violet-400/40' },
  12: { bg: 'from-fuchsia-400 via-fuchsia-500 to-pink-700',       border: 'border-fuchsia-300/60', glow: 'shadow-fuchsia-400/40' },
};

const CLASSIC: Record<number, { bg: string; border: string; glow: string }> = {
  0:  { bg: 'from-stone-700 via-stone-800 to-stone-950',     border: 'border-stone-400/40', glow: '' },
  1:  { bg: 'from-red-600 via-red-700 to-red-900',           border: 'border-red-400/50',  glow: '' },
  2:  { bg: 'from-orange-600 via-orange-700 to-orange-900',   border: 'border-orange-400/50', glow: '' },
  3:  { bg: 'from-yellow-500 via-yellow-600 to-amber-800',    border: 'border-yellow-400/50', glow: '' },
  4:  { bg: 'from-yellow-400 via-yellow-500 to-amber-700',     border: 'border-yellow-300/50', glow: '' },
  5:  { bg: 'from-green-600 via-green-700 to-emerald-900',     border: 'border-green-400/50', glow: '' },
  6:  { bg: 'from-emerald-600 via-emerald-700 to-teal-900',     border: 'border-emerald-400/50', glow: '' },
  7:  { bg: 'from-teal-600 via-teal-700 to-cyan-900',         border: 'border-teal-400/50', glow: '' },
  8:  { bg: 'from-sky-600 via-sky-700 to-blue-900',           border: 'border-sky-400/50', glow: '' },
  9:  { bg: 'from-blue-600 via-blue-700 to-indigo-900',       border: 'border-blue-400/50', glow: '' },
  10: { bg: 'from-indigo-600 via-indigo-700 to-violet-900',   border: 'border-indigo-400/50', glow: '' },
  11: { bg: 'from-purple-600 via-purple-700 to-fuchsia-900',   border: 'border-purple-400/50', glow: '' },
  12: { bg: 'from-fuchsia-600 via-fuchsia-700 to-pink-900',    border: 'border-fuchsia-400/50', glow: '' },
};

const DARK: Record<number, { bg: string; border: string; glow: string }> = {
  0:  { bg: 'from-neutral-800 via-neutral-900 to-black',     border: 'border-neutral-500/30', glow: 'shadow-white/5' },
  1:  { bg: 'from-rose-900 via-red-950 to-black',              border: 'border-rose-500/20',    glow: '' },
  2:  { bg: 'from-orange-900 via-amber-950 to-black',          border: 'border-orange-500/20',  glow: '' },
  3:  { bg: 'from-amber-900 via-yellow-950 to-black',           border: 'border-amber-500/20',   glow: '' },
  4:  { bg: 'from-yellow-900 via-yellow-950 to-black',          border: 'border-yellow-500/20',  glow: '' },
  5:  { bg: 'from-lime-900 via-green-950 to-black',            border: 'border-lime-500/20',     glow: '' },
  6:  { bg: 'from-emerald-900 via-teal-950 to-black',          border: 'border-emerald-500/20', glow: '' },
  7:  { bg: 'from-teal-900 via-cyan-950 to-black',             border: 'border-teal-500/20',     glow: '' },
  8:  { bg: 'from-cyan-900 via-sky-950 to-black',              border: 'border-cyan-500/20',    glow: '' },
  9:  { bg: 'from-blue-900 via-indigo-950 to-black',           border: 'border-blue-500/20',    glow: '' },
  10: { bg: 'from-indigo-900 via-violet-950 to-black',        border: 'border-indigo-500/20',   glow: '' },
  11: { bg: 'from-violet-900 via-purple-950 to-black',         border: 'border-violet-500/20',   glow: '' },
  12: { bg: 'from-fuchsia-900 via-pink-950 to-black',          border: 'border-fuchsia-500/20',  glow: '' },
};

export const VALUE_COLORS: Record<CardTheme, Record<number, { bg: string; border: string; glow: string }>> = {
  neon: NEON,
  classic: CLASSIC,
  dark: DARK,
};

export const SPECIAL_COLORS: Record<CardTheme, Record<'UP' | 'DOWN', { bg: string; border: string; glow: string }>> = {
  neon: {
    UP:   { bg: 'from-rose-400 via-pink-500 to-fuchsia-600', border: 'border-rose-300/70', glow: 'shadow-rose-400/50' },
    DOWN: { bg: 'from-sky-300 via-blue-500 to-indigo-600',   border: 'border-sky-300/70',  glow: 'shadow-sky-400/50' },
  },
  classic: {
    UP:   { bg: 'from-red-700 via-rose-800 to-pink-950',    border: 'border-red-400/60', glow: '' },
    DOWN: { bg: 'from-sky-700 via-blue-800 to-indigo-950',   border: 'border-sky-400/60', glow: '' },
  },
  dark: {
    UP:   { bg: 'from-rose-950 via-red-950 to-black',       border: 'border-rose-500/20', glow: '' },
    DOWN: { bg: 'from-sky-950 via-blue-950 to-black',       border: 'border-sky-500/20',  glow: '' },
  },
};

export function getStoredTheme(): CardTheme {
  if (typeof window === 'undefined') return 'neon';
  try { return (localStorage.getItem('upanddown_theme') as CardTheme) ?? 'neon'; } catch { return 'neon'; }
}
