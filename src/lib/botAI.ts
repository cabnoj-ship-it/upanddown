// ============================================================
// Up and Down – Bot AI Logic
// ============================================================

import type { Card, GameState } from './types';
import { getPlayableCards, getActivePlayer } from './gameLogic';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

const BOT_NAMES = [
  'Gizmo', 'Sprocket', 'Coppelia', 'Ratchet',
  'Tinker', 'Boltz', 'Wren', 'Piston',
  'Flicker', 'Cogsworth', 'Ember', 'Nixie',
];

export function pickBotName(usedNames: string[]): string {
  const available = BOT_NAMES.filter((n) => !usedNames.includes(n));
  return available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : `Bot-${Math.floor(Math.random() * 999)}`;
}

export function botChooseCard(
  state: GameState,
  difficulty: BotDifficulty
): Card | null {
  const playable = getPlayableCards(state);
  if (playable.length === 0) return null;

  switch (difficulty) {
    case 'easy':
      return easyStrategy(playable);
    case 'medium':
      return mediumStrategy(playable, state);
    case 'hard':
      return hardStrategy(playable, state);
    default:
      return playable[0];
  }
}

// Easy: random playable card
function easyStrategy(playable: Card[]): Card {
  return playable[Math.floor(Math.random() * playable.length)];
}

// Medium: prefer number cards, avoid specials; play closest to current value
function mediumStrategy(playable: Card[], state: GameState): Card {
  const numbers = playable.filter((c) => c.type === 'NUMBER');
  if (numbers.length === 0) return playable[0];

  const top = state.centerPile[state.centerPile.length - 1];
  if (!top || top.type !== 'NUMBER') return numbers[0];

  // Play the card closest to the top value
  const topVal = top.value!;
  numbers.sort((a, b) => Math.abs(a.value! - topVal) - Math.abs(b.value! - topVal));
  return numbers[0];
}

// Hard: strategic play — save specials, force closures, try to empty hand
function hardStrategy(playable: Card[], state: GameState): Card {
  const player = getActivePlayer(state);
  const handSize = player.hand.length;

  // If hand is small (<=3), prioritize getting rid of number cards
  const numbers = playable.filter((c) => c.type === 'NUMBER');
  const specials = playable.filter((c) => c.type === 'UP' || c.type === 'DOWN');

  // Try to cause a closure if we have duplicates or 0
  const top = state.centerPile[state.centerPile.length - 1];
  if (top?.type === 'NUMBER') {
    const dup = numbers.find((c) => c.value === top.value);
    if (dup && handSize > 2) return dup;
    const zero = numbers.find((c) => c.value === 0);
    if (zero && handSize > 2) return zero;
  }

  // If few cards left, play the highest/lowest to be strategic
  if (numbers.length > 0) {
    if (state.currentMode === 'UP') {
      // Play smallest valid number to keep options open
      numbers.sort((a, b) => a.value! - b.value!);
    } else {
      // Play largest valid number
      numbers.sort((a, b) => b.value! - a.value!);
    }
    return numbers[0];
  }

  // Fall back to specials
  if (specials.length > 0) return specials[0];

  return playable[0];
}

// Whether bot should announce "Up and Down"
export function botShouldAnnounce(state: GameState): boolean {
  if (!state.enableAnnounce) return false;
  const player = getActivePlayer(state);
  return player.hand.length === 2 && !player.hasAnnouncedUpDown;
}

// Delay in ms before bot acts (adds realism)
export function getBotDelay(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case 'easy': return 1200 + Math.random() * 800;
    case 'medium': return 800 + Math.random() * 600;
    case 'hard': return 500 + Math.random() * 500;
  }
}
