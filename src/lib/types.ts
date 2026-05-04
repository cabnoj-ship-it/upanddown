// ============================================================
// Up and Down – Shared Types
// ============================================================

export type CardType = 'NUMBER' | 'UP' | 'DOWN';

export interface Card {
  id: string;
  type: CardType;
  value?: number; // 0-12 for NUMBER, undefined for UP/DOWN
}

export type GameMode = 'UP' | 'DOWN';
export type GameDirection = 'CLOCKWISE' | 'COUNTER_CLOCKWISE';

export type GamePhase =
  | 'LOBBY'
  | 'DEALING'
  | 'PLAYER_TURN'
  | 'DOUBLE_PLAY'      // After playing UP/DOWN, must play second card
  | 'CLOSURE_PLAY'     // After 0 or duplicate, pile cleared, must play new base
  | 'ANNOUNCE_CHECK'
  | 'GAME_OVER';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  socketId: string;
  name: string;
  hand: Card[];
  hasAnnouncedUpDown: boolean;
  lastAnnouncedHandSize: number | null; // Track hand size when announced (for re-announce rule)
  elo: number;
  isConnected: boolean;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  finishOrder: number | null;    // 1 = 1st out (winner), null = still playing
}

export interface GameAction {
  type:
    | 'PLAY_CARD'
    | 'DRAW_CARD'
    | 'ANNOUNCE_UP_DOWN'
    | 'CONTRE'
    | 'PASS_TURN';
  playerId: string;
  card?: Card;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  players: Player[];
  deck: Card[];
  deckCount: number;           // Safe count for client
  centerPile: Card[];
  fosse: Card[];              // Discarded cards
  currentMode: GameMode;
  direction: GameDirection;
  activePlayerIndex: number;
  turnsSinceLastPlay: number; // Track blocking
  history: GameAction[];
  winner: string | null;
  rankings: { playerId: string; name: string; rank: number }[]; // Final ranking
  eliminatedPlayerIds: string[];  // Players who emptied their hand (in order)
  lastAction: string | null;  // Human-readable description
  turnNumber: number;           // Current turn counter
  turnStartedAt: number;       // Timestamp when current turn started
  turnTimeLimit: number;       // Seconds per turn (0 = no limit)
  lastPlayedCardInfo: { playerId: string; playerName: string; card: Card } | null;
  doublePlayPending: boolean; // Waiting for second card after UP/DOWN
  closurePlayPending: boolean; // Waiting for new base after closure
  // Tournament
  roundNumber: number;         // Current round (1-indexed)
  totalRounds: number;         // 0 = single game, >0 = tournament
  scores: Record<string, number>; // playerId → cumulated score
  handSize: number;            // Starting hand size
  // Optional mechanics
  enableAnnounce: boolean;      // Up&Down announce + contre mechanic
  // Room visibility
  isPublic: boolean;
  // Contre cooldown (ms timestamp until contre is allowed)
  contreCooldownUntil: number;
}

export interface RoomInfo {
  roomId: string;
  players: { id: string; name: string }[];
  maxPlayers: number;
  isStarted: boolean;
  isPublic: boolean;
}

// Socket events
export interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'game:error': (message: string) => void;
  'room:info': (info: RoomInfo) => void;
  'room:list': (rooms: RoomInfo[]) => void;
  'sfx:play': (sound: SFXType) => void;
  'game:timer': (data: { secondsLeft: number }) => void;
  'chat:message': (msg: { player: string; text: string }) => void;
  'game:reaction': (data: { playerId: string; playerName: string; emoji: string }) => void;
  'game:chat': (data: { playerId: string; playerName: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': (data: { playerName: string; maxPlayers: number; settings?: GameSettings }) => void;
  'game:startBotMatch': (data: { playerName: string; botCount: number; botDifficulty: BotDifficulty; settings?: GameSettings }) => void;
  'room:join': (data: { roomId: string; playerName: string }) => void;
  'room:list': () => void;
  'game:start': (data: { roomId: string }) => void;
  'game:playCard': (data: { roomId: string; cardId: string }) => void;
  'game:drawCard': (data: { roomId: string }) => void;
  'game:announceUpDown': (data: { roomId: string }) => void;
  'game:contre': (data: { roomId: string; targetPlayerId: string }) => void;
  'game:restart': (data: { roomId: string }) => void;
  'game:quit': (data: { roomId: string }) => void;
  'game:reaction': (data: { roomId: string; emoji: string }) => void;
  'room:addBot': (data: { roomId: string }) => void;
  'game:chat': (data: { roomId: string; message: string }) => void;
}

export type SFXType = 'draw' | 'play' | 'closure' | 'alert' | 'win' | 'error' | 'turn';

export interface GameSettings {
  handSize: number;      // 5-10
  turnTimeLimit: number; // 0=unlimited, 10-30
  totalRounds: number;   // 0=single, 3/5/7
  enableAnnounce: boolean; // Up&Down announce + contre mechanic
  isPublic: boolean;     // Room visibility
}
