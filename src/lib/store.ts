// ============================================================
// Up and Down – Client State (Zustand)
// ============================================================

import { create } from 'zustand';
import type { GameState, RoomInfo, SFXType } from './types';
import type { CardTheme } from './themes';
import { getStoredTheme } from './themes';

interface AppState {
  // Connection
  playerId: string | null;
  playerName: string;
  socketConnected: boolean;

  // Room
  roomInfo: RoomInfo | null;
  roomList: RoomInfo[];

  // Game
  gameState: GameState | null;
  error: string | null;

  // UI
  historyOpen: boolean;
  sfxQueue: SFXType[];
  reactions: { id: string; playerId: string; playerName: string; emoji: string; timestamp: number }[];
  chatMessages: { id: string; playerId: string; playerName: string; message: string; timestamp: number }[];
  turnSecondsLeft: number | null;
  cardTheme: CardTheme;

  // Actions
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setSocketConnected: (connected: boolean) => void;
  setRoomInfo: (info: RoomInfo | null) => void;
  setRoomList: (rooms: RoomInfo[]) => void;
  setGameState: (state: GameState | null) => void;
  setError: (error: string | null) => void;
  toggleHistory: () => void;
  queueSFX: (sfx: SFXType) => void;
  dequeueSFX: () => SFXType | undefined;
  addReaction: (playerId: string, playerName: string, emoji: string) => void;
  addChatMessage: (playerId: string, playerName: string, message: string) => void;
  setTurnSecondsLeft: (s: number | null) => void;
  setCardTheme: (t: CardTheme) => void;
  reset: () => void;
}

function getStoredName(): string {
  if (typeof window === 'undefined') return '';
  try { return localStorage.getItem('upanddown_name') ?? ''; } catch { return ''; }
}

export const useAppStore = create<AppState>((set, get) => ({
  playerId: null,
  playerName: getStoredName(),
  socketConnected: false,
  roomInfo: null,
  roomList: [],
  gameState: null,
  error: null,
  historyOpen: false,
  sfxQueue: [],
  reactions: [],
  chatMessages: [],
  turnSecondsLeft: null,
  cardTheme: getStoredTheme(),

  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => {
    set({ playerName: name });
    try { localStorage.setItem('upanddown_name', name); } catch {}
  },
  setSocketConnected: (connected) => set({ socketConnected: connected }),
  setRoomInfo: (info) => set({ roomInfo: info }),
  setRoomList: (rooms) => set({ roomList: rooms }),
  setGameState: (state) => set({ gameState: state }),
  setError: (error) => set({ error }),
  toggleHistory: () => set((s) => ({ historyOpen: !s.historyOpen })),
  addReaction: (playerId, playerName, emoji) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((s) => ({ reactions: [...s.reactions, { id, playerId, playerName, emoji, timestamp: Date.now() }] }));
    // Auto-remove after 3s
    setTimeout(() => {
      set((s) => ({ reactions: s.reactions.filter((r) => r.id !== id) }));
    }, 3000);
  },
  addChatMessage: (playerId, playerName, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((s) => ({ chatMessages: [...s.chatMessages, { id, playerId, playerName, message, timestamp: Date.now() }] }));
    // Auto-remove after 4s
    setTimeout(() => {
      set((s) => ({ chatMessages: s.chatMessages.filter((m) => m.id !== id) }));
    }, 4000);
  },
  setTurnSecondsLeft: (s) => set({ turnSecondsLeft: s }),
  setCardTheme: (t) => {
    set({ cardTheme: t });
    try { localStorage.setItem('upanddown_theme', t); } catch {}
  },
  queueSFX: (sfx) => set((s) => ({ sfxQueue: [...s.sfxQueue, sfx] })),
  dequeueSFX: () => {
    const q = get().sfxQueue;
    if (q.length === 0) return undefined;
    const [first, ...rest] = q;
    set({ sfxQueue: rest });
    return first;
  },
  reset: () =>
    set({
      roomInfo: null,
      gameState: null,
      error: null,
      historyOpen: false,
      reactions: [],
      chatMessages: [],
      turnSecondsLeft: null,
      cardTheme: getStoredTheme(),
    }),
}));
