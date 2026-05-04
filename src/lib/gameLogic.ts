// ============================================================
// Up and Down – Game Engine (Pure Functions + State Machine)
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import type {
  Card,
  CardType,
  GameState,
  GameMode,
  GameDirection,
  GamePhase,
  Player,
  GameAction,
} from './types';

// ── Deck Creation ──────────────────────────────────────────

export function createDeck(): Card[] {
  const cards: Card[] = [];

  // 8 copies of each value 0-12 → 104 cards
  for (let value = 0; value <= 12; value++) {
    for (let i = 0; i < 8; i++) {
      cards.push({ id: uuidv4(), type: 'NUMBER', value });
    }
  }

  // 8 UP cards
  for (let i = 0; i < 8; i++) {
    cards.push({ id: uuidv4(), type: 'UP' });
  }

  // 8 DOWN cards
  for (let i = 0; i < 8; i++) {
    cards.push({ id: uuidv4(), type: 'DOWN' });
  }

  return cards; // 120 total
}

// ── Fisher-Yates Shuffle ───────────────────────────────────

export function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Initial State ──────────────────────────────────────────

const CARDS_PER_PLAYER = 7;

export function createInitialState(
  roomId: string,
  players: Pick<Player, 'id' | 'socketId' | 'name' | 'elo' | 'isBot' | 'botDifficulty'>[],
  opts?: {
    roundNumber?: number;
    totalRounds?: number;
    scores?: Record<string, number>;
    handSize?: number;
    turnTimeLimit?: number;
    enableAnnounce?: boolean;
    isPublic?: boolean;
  }
): GameState {
  const handSize = opts?.handSize ?? CARDS_PER_PLAYER;
  const turnTimeLimit = opts?.turnTimeLimit ?? 15;
  const enableAnnounce = opts?.enableAnnounce ?? true;
  let deck = shuffle(createDeck());

  // Deal cards
  const gamePlayers: Player[] = players.map((p) => {
    const hand = deck.splice(0, handSize);
    return {
      ...p,
      hand,
      hasAnnouncedUpDown: false,
      lastAnnouncedHandSize: null,
      isConnected: true,
      finishOrder: null,
    };
  });

  // Draw initial base card (must be a number)
  let baseCard: Card | undefined;
  while (deck.length > 0) {
    const candidate = deck.shift()!;
    if (candidate.type === 'NUMBER') {
      baseCard = candidate;
      break;
    }
    // Put non-number cards back at the bottom
    deck.push(candidate);
  }

  return {
    roomId,
    phase: 'PLAYER_TURN',
    players: gamePlayers,
    deck,
    deckCount: deck.length,
    centerPile: baseCard ? [baseCard] : [],
    fosse: [],
    currentMode: 'UP',
    direction: 'CLOCKWISE',
    activePlayerIndex: 0,
    turnsSinceLastPlay: 0,
    history: [],
    winner: null,
    rankings: [],
    eliminatedPlayerIds: [],
    lastAction: null,
    turnNumber: 1,
    turnStartedAt: Date.now(),
    turnTimeLimit,
    lastPlayedCardInfo: null,
    doublePlayPending: false,
    closurePlayPending: false,
    roundNumber: opts?.roundNumber ?? 1,
    totalRounds: opts?.totalRounds ?? 0,
    scores: opts?.scores ?? {},
    handSize,
    enableAnnounce,
    isPublic: opts?.isPublic ?? true,
    contreCooldownUntil: 0,
  };
}

// ── Helpers ────────────────────────────────────────────────

export function getTopCard(state: GameState): Card | null {
  return state.centerPile.length > 0
    ? state.centerPile[state.centerPile.length - 1]
    : null;
}

export function getActivePlayer(state: GameState): Player {
  return state.players[state.activePlayerIndex];
}

function nextPlayerIndex(state: GameState): number {
  const n = state.players.length;
  const step = state.direction === 'CLOCKWISE' ? 1 : -1;
  let idx = state.activePlayerIndex;
  for (let i = 0; i < n; i++) {
    idx = (idx + step + n) % n;
    // Skip eliminated players
    if (state.players[idx].finishOrder === null) return idx;
  }
  return state.activePlayerIndex; // fallback (shouldn't happen)
}

function reverseDirection(dir: GameDirection): GameDirection {
  return dir === 'CLOCKWISE' ? 'COUNTER_CLOCKWISE' : 'CLOCKWISE';
}

// ── Validation ─────────────────────────────────────────────

export function isValidPlay(state: GameState, card: Card): boolean {
  // During closure play, any number card is valid as new base
  if (state.closurePlayPending) {
    return card.type === 'NUMBER';
  }

  // During double play (after UP/DOWN), must play a number card
  if (state.doublePlayPending) {
    return card.type === 'NUMBER';
  }

  // UP/DOWN cards are always playable
  if (card.type === 'UP' || card.type === 'DOWN') return true;

  const top = getTopCard(state);
  if (!top || top.type !== 'NUMBER') return true; // No reference → anything goes

  const topVal = top.value!;
  const cardVal = card.value!;

  // 0 is always playable (triggers closure)
  if (cardVal === 0) return true;

  // Duplicate is always playable (triggers closure)
  if (cardVal === topVal) return true;

  if (state.currentMode === 'UP') {
    return cardVal >= topVal;
  } else {
    return cardVal <= topVal;
  }
}

export function getPlayableCards(state: GameState): Card[] {
  const player = getActivePlayer(state);
  return player.hand.filter((c) => isValidPlay(state, c));
}

// ── State Transitions (Reducer) ────────────────────────────

export type GameEvent =
  | { type: 'PLAY_CARD'; playerId: string; cardId: string }
  | { type: 'DRAW_CARD'; playerId: string }
  | { type: 'ANNOUNCE_UP_DOWN'; playerId: string }
  | { type: 'CONTRE'; playerId: string; targetPlayerId: string }
  | { type: 'PASS_TURN'; playerId: string }
  | { type: 'AUTO_BASE' }; // Blocking resolution

export function gameReducer(state: GameState, event: GameEvent): GameState {
  let next: GameState;
  switch (event.type) {
    case 'PLAY_CARD':
      next = handlePlayCard(state, event.playerId, event.cardId); break;
    case 'DRAW_CARD':
      next = handleDrawCard(state, event.playerId); break;
    case 'ANNOUNCE_UP_DOWN':
      next = handleAnnounce(state, event.playerId); break;
    case 'CONTRE':
      next = handleContre(state, event.playerId, event.targetPlayerId); break;
    case 'PASS_TURN':
      next = handlePassTurn(state, event.playerId); break;
    case 'AUTO_BASE':
      next = handleAutoBase(state); break;
    default:
      return state;
  }
  next.deckCount = next.deck.length;
  // Incrémenter le tour et réinitialiser le timer quand le joueur actif change
  if (next.activePlayerIndex !== state.activePlayerIndex) {
    next.turnNumber = (state.turnNumber ?? 0) + 1;
    next.turnStartedAt = Date.now();
  }
  return next;
}

// ── Play Card ──────────────────────────────────────────────

function handlePlayCard(
  state: GameState,
  playerId: string,
  cardId: string
): GameState {
  if (state.phase === 'GAME_OVER' || state.phase === 'LOBBY') return state;

  const player = getActivePlayer(state);
  if (player.id !== playerId) return state;

  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand[cardIndex];
  if (!isValidPlay(state, card)) return state;

  // Remove card from hand
  const newHand = [...player.hand];
  newHand.splice(cardIndex, 1);

  // Reset lastAnnouncedHandSize if hand exceeds 2 (player can re-announce later)
  const shouldResetAnnounce = newHand.length > 2;

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId
      ? {
          ...p,
          hand: newHand,
          hasAnnouncedUpDown: newHand.length === 2 ? p.hasAnnouncedUpDown : false,
          lastAnnouncedHandSize: shouldResetAnnounce ? null : p.lastAnnouncedHandSize,
        }
      : p
  );

  const action: GameAction = {
    type: 'PLAY_CARD',
    playerId,
    card,
    timestamp: Date.now(),
  };

  let newState: GameState = {
    ...state,
    players: updatedPlayers,
    history: [...state.history, action],
    turnsSinceLastPlay: 0,
    lastPlayedCardInfo: { playerId, playerName: player.name, card },
    contreCooldownUntil: Date.now() + 1000, // 1s cooldown after play
  };

  // Check if player emptied their hand → eliminated (ranked)
  const currentPlayer = updatedPlayers.find((p) => p.id === playerId)!;
  if (currentPlayer.hand.length === 0) {
    const eliminatedSoFar = newState.eliminatedPlayerIds.length;
    const finishOrder = eliminatedSoFar + 1; // 1st out = rank 1 (winner)
    const newEliminated = [...newState.eliminatedPlayerIds, playerId];

    const rankedPlayers = updatedPlayers.map((p) =>
      p.id === playerId ? { ...p, finishOrder } : p
    );

    // Count remaining active players
    const activePlayers = rankedPlayers.filter((p) => p.finishOrder === null);

    if (activePlayers.length <= 1) {
      // Game over — last player is the loser
      const loser = activePlayers[0];
      const loserOrder = rankedPlayers.length;
      const finalPlayers = loser
        ? rankedPlayers.map((p) => p.id === loser.id ? { ...p, finishOrder: loserOrder } : p)
        : rankedPlayers;
      const finalEliminated = loser ? [...newEliminated, loser.id] : newEliminated;

      // Build rankings
      const rankings = finalPlayers
        .filter((p) => p.finishOrder !== null)
        .sort((a, b) => a.finishOrder! - b.finishOrder!)
        .map((p) => ({ playerId: p.id, name: p.name, rank: p.finishOrder! }));

      return {
        ...newState,
        players: finalPlayers,
        eliminatedPlayerIds: finalEliminated,
        rankings,
        phase: 'GAME_OVER',
        winner: rankings[0]?.playerId ?? playerId,
        lastAction: `${player.name} se débarrasse de ses cartes ! Partie terminée !`,
        doublePlayPending: false,
        closurePlayPending: false,
      };
    }

    // Player is out but game continues
    newState = {
      ...newState,
      players: rankedPlayers,
      eliminatedPlayerIds: newEliminated,
      lastAction: `${player.name} n'a plus de cartes ! (${finishOrder}${finishOrder === 1 ? 'er' : 'e'})`,
    };
    // Skip to next active player
    newState = { ...newState, activePlayerIndex: nextPlayerIndex(newState) };
    return {
      ...newState,
      phase: 'PLAYER_TURN',
      doublePlayPending: false,
      closurePlayPending: false,
    };
  }

  // Handle card effects
  if (card.type === 'UP') {
    return {
      ...newState,
      centerPile: [...state.centerPile, card],
      currentMode: 'UP',
      phase: 'DOUBLE_PLAY',
      doublePlayPending: true,
      closurePlayPending: false,
      lastAction: `${player.name} joue UP ! Doit poser une seconde carte.`,
    };
  }

  if (card.type === 'DOWN') {
    return {
      ...newState,
      centerPile: [...state.centerPile, card],
      currentMode: 'DOWN',
      phase: 'DOUBLE_PLAY',
      doublePlayPending: true,
      closurePlayPending: false,
      lastAction: `${player.name} joue DOWN ! Doit poser une seconde carte.`,
    };
  }

  // Number card
  const topCard = getTopCard(state);
  const isClosure =
    card.value === 0 ||
    (topCard?.type === 'NUMBER' && topCard.value === card.value);

  if (isClosure && !state.closurePlayPending) {
    // Closure: clear pile, reverse direction, player plays new base
    const newFosse = [...state.fosse, ...state.centerPile, card];
    return {
      ...newState,
      centerPile: [],
      fosse: newFosse,
      direction: reverseDirection(state.direction),
      phase: 'CLOSURE_PLAY',
      closurePlayPending: true,
      doublePlayPending: false,
      lastAction: `${player.name} ferme la pile ! Direction inversée. Doit poser une nouvelle base.`,
    };
  }

  // Normal number card play
  const newCenterPile = [...state.centerPile, card];

  // If we were in double play mode, this resolves it
  if (state.doublePlayPending) {
    return {
      ...newState,
      centerPile: newCenterPile,
      phase: 'PLAYER_TURN',
      doublePlayPending: false,
      closurePlayPending: false,
      activePlayerIndex: nextPlayerIndex(newState),
      lastAction: `${player.name} pose ${card.value} comme seconde carte.`,
    };
  }

  // If we were in closure play mode, this resolves it
  if (state.closurePlayPending) {
    return {
      ...newState,
      centerPile: [card],
      phase: 'PLAYER_TURN',
      closurePlayPending: false,
      doublePlayPending: false,
      activePlayerIndex: nextPlayerIndex(newState),
      lastAction: `${player.name} pose ${card.value} comme nouvelle base.`,
    };
  }

  // Standard play → advance turn
  return {
    ...newState,
    centerPile: newCenterPile,
    phase: 'PLAYER_TURN',
    activePlayerIndex: nextPlayerIndex(newState),
    lastAction: `${player.name} pose ${card.value}.`,
  };
}

// ── Draw Card ──────────────────────────────────────────────

function handleDrawCard(state: GameState, playerId: string): GameState {
  if (state.phase === 'GAME_OVER') return state;

  const player = getActivePlayer(state);
  if (player.id !== playerId) return state;

  if (state.deck.length === 0) {
    // Reshuffle fosse into deck
    if (state.fosse.length === 0) {
      return { ...state, lastAction: 'Plus de cartes disponibles !' };
    }
    state = {
      ...state,
      deck: shuffle(state.fosse),
      fosse: [],
    };
  }

  const drawnCard = state.deck[0];
  const newDeck = state.deck.slice(1);
  const newHand = [...player.hand, drawnCard];

  // Reset lastAnnouncedHandSize if hand exceeds 2 (player can re-announce later)
  const shouldResetAnnounce = newHand.length > 2;

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId
      ? {
          ...p,
          hand: newHand,
          hasAnnouncedUpDown: newHand.length === 2 ? p.hasAnnouncedUpDown : false,
          lastAnnouncedHandSize: shouldResetAnnounce ? null : p.lastAnnouncedHandSize,
        }
      : p
  );

  const action: GameAction = {
    type: 'DRAW_CARD',
    playerId,
    timestamp: Date.now(),
  };

  return {
    ...state,
    players: updatedPlayers,
    deck: newDeck,
    history: [...state.history, action],
    activePlayerIndex: nextPlayerIndex(state),
    turnsSinceLastPlay: state.turnsSinceLastPlay + 1,
    phase: 'PLAYER_TURN',
    doublePlayPending: false,
    closurePlayPending: false,
    contreCooldownUntil: Date.now() + 1000, // 1s cooldown after draw
    lastAction: `${player.name} pioche une carte.`,
  };
}

// ── Announce "Up and Down" ─────────────────────────────────

function handleAnnounce(state: GameState, playerId: string): GameState {
  if (!state.enableAnnounce) return state;
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  if (player.hand.length !== 2) return state;

  // Ré-annonce impossible si on a annoncé à 2 cartes, descendu à 1, remonté à 2
  // Il faut être monté à 3 puis redescendu à 2
  if (player.lastAnnouncedHandSize === 2) return state;

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, hasAnnouncedUpDown: true, lastAnnouncedHandSize: 2 } : p
  );

  return {
    ...state,
    players: updatedPlayers,
    lastAction: `${player.name} annonce "Up and Down" !`,
  };
}

// ── Contre ─────────────────────────────────────────────────

function handleContre(
  state: GameState,
  accuserId: string,
  targetPlayerId: string
): GameState {
  if (!state.enableAnnounce) return state;
  if (Date.now() < state.contreCooldownUntil) return state;
  const target = state.players.find((p) => p.id === targetPlayerId);
  if (!target) return state;

  // Target must have EXACTLY 2 cards and NOT have announced
  if (target.hand.length !== 2 || target.hasAnnouncedUpDown) {
    return state;
  }

  // Penalty: draw 2 cards
  let deck = [...state.deck];
  if (deck.length < 2) {
    deck = [...deck, ...shuffle(state.fosse)];
    state = { ...state, fosse: [] };
  }

  const penaltyCards = deck.splice(0, 2);
  const newHand = [...target.hand, ...penaltyCards];

  const updatedPlayers = state.players.map((p) =>
    p.id === targetPlayerId
      ? { ...p, hand: newHand, hasAnnouncedUpDown: false, lastAnnouncedHandSize: null }
      : p
  );

  const accuser = state.players.find((p) => p.id === accuserId);

  return {
    ...state,
    players: updatedPlayers,
    deck,
    lastAction: `${accuser?.name ?? 'Quelqu\'un'} contre ${target.name} ! +2 cartes de pénalité.`,
  };
}

// ── Pass Turn ──────────────────────────────────────────────

function handlePassTurn(state: GameState, playerId: string): GameState {
  const player = getActivePlayer(state);
  if (player.id !== playerId) return state;

  const newTurnsSinceLastPlay = state.turnsSinceLastPlay + 1;

  // After 2 turns without play, auto-base
  if (newTurnsSinceLastPlay >= state.players.length * 2) {
    return handleAutoBase({
      ...state,
      turnsSinceLastPlay: newTurnsSinceLastPlay,
    });
  }

  return {
    ...state,
    activePlayerIndex: nextPlayerIndex(state),
    turnsSinceLastPlay: newTurnsSinceLastPlay,
    phase: 'PLAYER_TURN',
    lastAction: `${player.name} passe son tour.`,
  };
}

// ── Auto Base (Blocking Resolution) ────────────────────────

function handleAutoBase(state: GameState): GameState {
  if (state.deck.length === 0 && state.fosse.length === 0) {
    return { ...state, lastAction: 'Blocage ! Aucune carte disponible.' };
  }

  let deck = [...state.deck];
  if (deck.length === 0) {
    deck = shuffle(state.fosse);
    state = { ...state, fosse: [] };
  }

  const newBase = deck.shift()!;
  const newFosse = [...state.fosse, ...state.centerPile];

  return {
    ...state,
    deck,
    centerPile: [newBase],
    fosse: newFosse,
    turnsSinceLastPlay: 0,
    phase: 'PLAYER_TURN',
    lastAction: `Blocage résolu ! Nouvelle base tirée : ${newBase.type === 'NUMBER' ? newBase.value : newBase.type}.`,
  };
}

// ── Sanitize State for Client ──────────────────────────────
// Hide other players' hands

export function sanitizeStateForPlayer(
  state: GameState,
  playerId: string
): GameState {
  const me = state.players.find((p) => p.id === playerId);
  const isSpectator = me?.finishOrder !== null;

  return {
    ...state,
    deck: [], // Don't send deck to client
    deckCount: state.deck.length,
    players: state.players.map((p) => ({
      ...p,
      hand: p.id === playerId || isSpectator ? p.hand : p.hand.map(() => ({
        id: 'hidden',
        type: 'NUMBER' as const,
        value: -1,
      })),
    })),
  };
}
