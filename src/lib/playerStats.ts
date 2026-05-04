// ============================================================
// Up and Down – Stats joueur (localStorage)
// ============================================================

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;       // dernière place
  topThree: number;     // podium (1er, 2e, 3e)
  bestRank: number;     // meilleur classement (1 = meilleur)
  elo: number;
  bestStreak: number;
  currentStreak: number;
  totalCardsPlayed: number;
  closures: number;     // fermetures de pile
  contresGiven: number; // contres que TU as infligés
  contresReceived: number; // contres que tu as SUBIS
  badges: string[];
}

const STORAGE_KEY = 'upanddown_stats';
const DEFAULT_ELO = 1000;

export function getStats(): PlayerStats {
  if (typeof window === 'undefined') return defaultStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats();
    return { ...defaultStats(), ...JSON.parse(raw) };
  } catch {
    return defaultStats();
  }
}

export function saveStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function defaultStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    topThree: 0,
    bestRank: 999,
    elo: DEFAULT_ELO,
    bestStreak: 0,
    currentStreak: 0,
    totalCardsPlayed: 0,
    closures: 0,
    contresGiven: 0,
    contresReceived: 0,
    badges: [],
  };
}

// ELO calculation (simplified)
export function calculateEloChange(
  currentElo: number,
  rank: number,
  totalPlayers: number
): number {
  // Expected score: 0.5 for middle, higher for better rank
  const expectedRank = (totalPlayers + 1) / 2;
  const performance = (expectedRank - rank) / (totalPlayers - 1); // -0.5 to 0.5
  const K = 32;
  return Math.round(K * performance);
}

// Check and award badges
const BADGE_DEFINITIONS: { id: string; label: string; check: (s: PlayerStats) => boolean }[] = [
  { id: 'first_win', label: 'Première Victoire', check: (s) => s.wins >= 1 },
  { id: 'ten_wins', label: '10 Victoires', check: (s) => s.wins >= 10 },
  { id: 'fifty_wins', label: '50 Victoires', check: (s) => s.wins >= 50 },
  { id: 'ten_games', label: '10 Parties', check: (s) => s.gamesPlayed >= 10 },
  { id: 'fifty_games', label: '50 Parties', check: (s) => s.gamesPlayed >= 50 },
  { id: 'streak_3', label: 'Série de 3', check: (s) => s.bestStreak >= 3 },
  { id: 'streak_5', label: 'Série de 5', check: (s) => s.bestStreak >= 5 },
  { id: 'elo_1200', label: 'ELO 1200+', check: (s) => s.elo >= 1200 },
  { id: 'elo_1500', label: 'ELO 1500+', check: (s) => s.elo >= 1500 },
  { id: 'closure_10', label: '10 Fermetures', check: (s) => s.closures >= 10 },
  { id: 'contre_5', label: '5 Contres', check: (s) => s.contresGiven >= 5 },
  { id: 'contre_20', label: '20 Contres', check: (s) => s.contresGiven >= 20 },
];

export function updateBadges(stats: PlayerStats): string[] {
  const newBadges = [...stats.badges];
  for (const badge of BADGE_DEFINITIONS) {
    if (!newBadges.includes(badge.id) && badge.check(stats)) {
      newBadges.push(badge.id);
    }
  }
  return newBadges;
}

export function getBadgeLabel(id: string): string {
  return BADGE_DEFINITIONS.find((b) => b.id === id)?.label ?? id;
}

export function recordGameResult(
  rank: number,
  totalPlayers: number,
  cardsPlayed: number,
  closureCount: number,
  contresGiven: number = 0,
  contresReceived: number = 0
): { stats: PlayerStats; newBadges: string[] } {
  const stats = getStats();
  
  stats.gamesPlayed++;
  stats.totalCardsPlayed += cardsPlayed;
  stats.closures += closureCount;
  stats.contresGiven += contresGiven;
  stats.contresReceived += contresReceived;
  stats.bestRank = Math.min(stats.bestRank, rank);

  const eloChange = calculateEloChange(stats.elo, rank, totalPlayers);
  stats.elo = Math.max(0, stats.elo + eloChange);

  if (rank <= 3) stats.topThree++;

  if (rank === 1) {
    stats.wins++;
    stats.currentStreak++;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  if (rank === totalPlayers) {
    stats.losses++;
  }

  const oldBadges = [...stats.badges];
  stats.badges = updateBadges(stats);
  const newBadges = stats.badges.filter((b) => !oldBadges.includes(b));

  saveStats(stats);
  return { stats, newBadges };
}
