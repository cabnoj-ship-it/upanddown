// ============================================================
// Up and Down – Panneau de statistiques joueur
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStats, getBadgeLabel, type PlayerStats } from '@/lib/playerStats';

const BADGE_EMOJIS: Record<string, string> = {
  first_win: '🏆',
  ten_wins: '⭐',
  fifty_wins: '💎',
  ten_games: '🎮',
  fifty_games: '🎯',
  streak_3: '🔥',
  streak_5: '💥',
  elo_1200: '📈',
  elo_1500: '🚀',
  closure_10: '🔄',
};

export default function StatsPanel() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    if (open) setStats(getStats());
  }, [open]);

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        className="fixed top-3 left-3 z-30 w-9 h-9 rounded-full flex items-center justify-center
          bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur text-sm"
      >
        📊
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && stats && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-40 h-full w-72 p-4 pt-14 overflow-y-auto
              bg-black/70 backdrop-blur-2xl border-r border-white/10"
          >
            <h2 className="text-lg font-black mb-4 bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
              Statistiques
            </h2>

            {/* ELO */}
            <div className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-white/40 text-[0.6rem] font-bold uppercase tracking-wider mb-1">ELO</div>
              <div className="text-3xl font-black text-white">{stats.elo}</div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatCard label="Parties" value={stats.gamesPlayed} />
              <StatCard label="Victoires" value={stats.wins} color="text-yellow-400" />
              <StatCard label="Défaites" value={stats.losses} color="text-red-400" />
              <StatCard label="Podiums" value={stats.topThree} color="text-amber-300" />
              <StatCard label="Série actuelle" value={stats.currentStreak} color="text-emerald-400" />
              <StatCard label="Meilleure série" value={stats.bestStreak} color="text-cyan-400" />
              <StatCard label="Cartes jouées" value={stats.totalCardsPlayed} />
              <StatCard label="Fermetures" value={stats.closures} color="text-fuchsia-400" />
            </div>

            {/* Win rate */}
            {stats.gamesPlayed > 0 && (
              <div className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-white/40 text-[0.6rem] font-bold uppercase tracking-wider mb-1">Taux de victoire</div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-emerald-400">
                    {Math.round((stats.wins / stats.gamesPlayed) * 100)}%
                  </span>
                  <span className="text-white/30 text-xs mb-0.5">
                    ({stats.wins}/{stats.gamesPlayed})
                  </span>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="mb-2">
              <div className="text-white/40 text-[0.6rem] font-bold uppercase tracking-wider mb-2">
                Succès ({stats.badges.length}/10)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {stats.badges.length === 0 ? (
                  <div className="col-span-2 text-white/20 text-xs text-center py-3">
                    Aucun succès encore
                  </div>
                ) : (
                  stats.badges.map((badgeId) => (
                    <div
                      key={badgeId}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                        bg-violet-500/10 border border-violet-400/20"
                    >
                      <span className="text-sm">{BADGE_EMOJIS[badgeId] ?? '🏅'}</span>
                      <span className="text-[0.55rem] font-bold text-violet-300 truncate">
                        {getBadgeLabel(badgeId)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-black/30"
          />
        )}
      </AnimatePresence>
    </>
  );
}

function StatCard({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
      <div className="text-white/30 text-[0.55rem] font-bold uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-black ${color}`}>{value}</div>
    </div>
  );
}
