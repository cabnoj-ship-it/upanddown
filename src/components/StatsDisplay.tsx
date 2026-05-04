// ============================================================
// Up and Down – Player Stats Display
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  topThree: number;
  bestRank: number;
  elo: number;
  bestStreak: number;
  currentStreak: number;
  totalCardsPlayed: number;
  closures: number;
  contresGiven: number;
  contresReceived: number;
  badges: string[];
}

const STORAGE_KEY = 'upanddown_stats';

export default function StatsDisplay() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setStats(JSON.parse(stored));
    }
  }, []);

  const winRate = stats ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : '0';

  if (!stats) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl font-black text-[0.6rem]
          bg-white/5 border border-white/10 text-white/70
          hover:bg-white/10 hover:text-white transition-all backdrop-blur"
      >
        📊 Stats
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md mx-4 p-6 rounded-3xl
                bg-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white text-xl"
              >
                ✕
              </motion.button>

              <h2 className="text-2xl font-black mb-6 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Vos Statistiques
              </h2>

              <div className="space-y-4">
                {/* Main stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="text-2xl font-black text-white">{stats.gamesPlayed}</div>
                    <div className="text-[0.55rem] text-white/50 font-bold uppercase">Parties</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-center">
                    <div className="text-2xl font-black text-emerald-400">{stats.wins}</div>
                    <div className="text-[0.55rem] text-emerald-300/70 font-bold uppercase">Victoires</div>
                  </div>
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-center">
                    <div className="text-2xl font-black text-red-400">{stats.losses}</div>
                    <div className="text-[0.55rem] text-red-300/70 font-bold uppercase">Défaites</div>
                  </div>
                </div>

                {/* Win rate */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-400/20">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm font-bold">Taux de victoire</span>
                    <span className="text-2xl font-black text-violet-300">{winRate}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${winRate}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    />
                  </div>
                </div>

                {/* Detailed stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <div>
                        <div className="text-[0.5rem] text-white/40 font-bold uppercase">Top 3</div>
                        <div className="text-sm font-bold text-white">{stats.topThree}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <div>
                        <div className="text-[0.5rem] text-white/40 font-bold uppercase">Meilleur rang</div>
                        <div className="text-sm font-bold text-amber-300">#{stats.bestRank || '-'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔥</span>
                      <div>
                        <div className="text-[0.5rem] text-white/40 font-bold uppercase">Meilleur série</div>
                        <div className="text-sm font-bold text-orange-300">{stats.bestStreak}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📈</span>
                      <div>
                        <div className="text-[0.5rem] text-white/40 font-bold uppercase">Série actuelle</div>
                        <div className="text-sm font-bold text-cyan-300">{stats.currentStreak}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🃏</span>
                      <div>
                        <div className="text-[0.5rem] text-white/40 font-bold uppercase">Cartes jouées</div>
                        <div className="text-sm font-bold text-white">{stats.totalCardsPlayed}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <div>
                        <div className="text-[0.5rem] text-white/40 font-bold uppercase">Clôtures</div>
                        <div className="text-sm font-bold text-white">{stats.closures}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚔️</span>
                      <div>
                        <div className="text-[0.5rem] text-white/40 font-bold uppercase">Contres donnés</div>
                        <div className="text-sm font-bold text-white">{stats.contresGiven}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛡️</span>
                      <div>
                        <div className="text-[0.5rem] text-white/40 font-bold uppercase">Contres reçus</div>
                        <div className="text-sm font-bold text-white">{stats.contresReceived}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ELO */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm font-bold">ELO actuel</span>
                    <span className="text-2xl font-black text-amber-300">{stats.elo}</span>
                  </div>
                </div>

                {/* Badges */}
                {stats.badges.length > 0 && (
                  <div>
                    <div className="text-white/50 text-xs font-bold uppercase mb-2">Badges</div>
                    <div className="flex flex-wrap gap-2">
                      {stats.badges.map((badge, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[0.65rem] font-bold text-white/70"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
