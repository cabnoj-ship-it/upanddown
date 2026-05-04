// ============================================================
// Up and Down – Custom Server (Next.js + Socket.io + Bot AI)
// ============================================================

import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  createInitialState,
  gameReducer,
  sanitizeStateForPlayer,
  getActivePlayer,
  getPlayableCards,
} from './src/lib/gameLogic';
import {
  botChooseCard,
  botShouldAnnounce,
  getBotDelay,
  pickBotName,
} from './src/lib/botAI';
import type {
  GameState,
  ServerToClientEvents,
  ClientToServerEvents,
  RoomInfo,
  SFXType,
  BotDifficulty,
  GameSettings,
} from './src/lib/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface RoomPlayer {
  id: string;
  socketId: string;
  name: string;
  elo: number;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
}

interface Room {
  id: string;
  maxPlayers: number;
  players: RoomPlayer[];
  gameState: GameState | null;
  botTimers: Map<string, NodeJS.Timeout>;
  contreTimers: Map<string, NodeJS.Timeout>; // botId -> timer
  turnTimer: NodeJS.Timeout | null;
  turnTickInterval: NodeJS.Timeout | null;
  isPublic: boolean;
  settings?: GameSettings;
}

const rooms = new Map<string, Room>();

// Generate a short readable room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Reconnection: map playerId → { roomId, name, timeout }
const disconnectedPlayers = new Map<string, { roomId: string; name: string; timeout: NodeJS.Timeout }>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: { origin: '*' },
      pingInterval: 10000,
      pingTimeout: 5000,
    }
  );

  // ── Helpers ──────────────────────────────────────────

  function broadcastRoomList() {
    const list: RoomInfo[] = [];
    rooms.forEach((room) => {
      if (!room.isPublic) return; // hide private rooms
      list.push({
        roomId: room.id,
        players: room.players.map((p) => ({ id: p.id, name: p.name })),
        maxPlayers: room.maxPlayers,
        isStarted: room.gameState !== null,
        isPublic: room.isPublic,
      });
    });
    io.emit('room:list', list);
  }

  function broadcastGameState(room: Room) {
    if (!room.gameState) return;
    room.players.forEach((p) => {
      if (!p.isBot) {
        const sanitized = sanitizeStateForPlayer(room.gameState!, p.id);
        io.to(p.socketId).emit('game:state', sanitized);
      }
    });
    // Restart turn timer for the new active player
    startTurnTimer(room);
  }

  function emitSFXToRoom(room: Room, sfx: SFXType) {
    room.players.forEach((p) => {
      if (!p.isBot) {
        io.to(p.socketId).emit('sfx:play', sfx);
      }
    });
  }

  // ── Turn Timer ──────────────────────────────────────

  function clearTurnTimer(room: Room) {
    if (room.turnTimer) { clearTimeout(room.turnTimer); room.turnTimer = null; }
    if (room.turnTickInterval) { clearInterval(room.turnTickInterval); room.turnTickInterval = null; }
  }

  function startTurnTimer(room: Room) {
    clearTurnTimer(room);
    if (!room.gameState || room.gameState.phase === 'GAME_OVER') return;

    const active = getActivePlayer(room.gameState);
    if (active.isBot) return; // Bots have their own timer
    if (active.finishOrder !== null) return;

    const limit = room.gameState.turnTimeLimit;
    if (!limit || limit <= 0) return;

    let secondsLeft = limit;

    // Tick every second
    room.turnTickInterval = setInterval(() => {
      secondsLeft--;
      room.players.forEach((p) => {
        if (!p.isBot) io.to(p.socketId).emit('game:timer', { secondsLeft: Math.max(0, secondsLeft) });
      });
    }, 1000);

    // Auto-draw when time is up
    room.turnTimer = setTimeout(() => {
      clearTurnTimer(room);
      if (!room.gameState || room.gameState.phase === 'GAME_OVER') return;
      const current = getActivePlayer(room.gameState);
      if (current.id !== active.id) return;

      // Force draw
      room.gameState = gameReducer(room.gameState, {
        type: 'DRAW_CARD',
        playerId: active.id,
      });
      emitSFXToRoom(room, 'draw');
      broadcastGameState(room);

      // Check if player became contrable after forced draw
      const actingPlayer = room.gameState.players.find((p) => p.id === active.id);
      if (actingPlayer && actingPlayer.hand.length > 0 && actingPlayer.hand.length <= 2 && !actingPlayer.hasAnnouncedUpDown) {
        triggerBotContre(room, active.id);
      }

      scheduleBotTurn(room);
      startTurnTimer(room);
    }, limit * 1000);
  }

  // ── Bot Auto-Play ────────────────────────────────────

  function clearBotContreTimers(room: Room) {
    room.contreTimers.forEach((t) => clearTimeout(t));
    room.contreTimers.clear();
  }

  function triggerBotContre(room: Room, targetPlayerId: string) {
    if (!room.gameState || room.gameState.phase === 'GAME_OVER') return;
    if (!room.gameState.enableAnnounce) return;
    if (Date.now() < room.gameState.contreCooldownUntil) return;

    const target = room.gameState.players.find((p) => p.id === targetPlayerId);
    if (!target || target.hand.length === 0 || target.hand.length > 2 || target.hasAnnouncedUpDown) return;

    // Give bots a chance to contre with a small delay
    room.players.forEach((bot) => {
      if (!bot.isBot || bot.id === targetPlayerId) return;

      // Contre probability and speed based on difficulty
      const willContre =
        bot.botDifficulty === 'hard' ? Math.random() < 0.9 :
        bot.botDifficulty === 'medium' ? Math.random() < 0.6 :
        Math.random() < 0.3;
      if (!willContre) return;

      const delay =
        bot.botDifficulty === 'hard' ? 400 + Math.random() * 600 :
        bot.botDifficulty === 'medium' ? 800 + Math.random() * 800 :
        1200 + Math.random() * 1000;

      const t = setTimeout(() => {
        if (!room.gameState || room.gameState.phase === 'GAME_OVER') return;
        const stillTarget = room.gameState.players.find((p) => p.id === targetPlayerId);
        if (!stillTarget || stillTarget.hand.length === 0 || stillTarget.hand.length > 2 || stillTarget.hasAnnouncedUpDown) return;

        room.gameState = gameReducer(room.gameState, {
          type: 'CONTRE',
          playerId: bot.id,
          targetPlayerId,
        });
        emitSFXToRoom(room, 'error');
        broadcastGameState(room);
      }, delay);

      room.contreTimers.set(bot.id, t);
    });

    // Clear contre timers after window closes
    setTimeout(() => {
      clearBotContreTimers(room);
    }, 2800);
  }

  function scheduleBotAnnounce(room: Room, botId: string, difficulty: BotDifficulty) {
    // Chance that bot "forgets" to announce → vulnerable to contre
    const forgetChance =
      difficulty === 'hard' ? 0.05 :   // Hard: forgets 5% of time
      difficulty === 'medium' ? 0.20 : // Medium: 20%
      0.45;                             // Easy: 45%
    if (Math.random() < forgetChance) return; // Bot forgets → can be contre'd

    // Delayed announce so humans have a chance to contre
    const delay =
      difficulty === 'hard' ? 600 + Math.random() * 400 :  // 0.6-1.0s
      difficulty === 'medium' ? 900 + Math.random() * 500 : // 0.9-1.4s
      1200 + Math.random() * 700;                            // 1.2-1.9s

    const timer = setTimeout(() => {
      if (!room.gameState || room.gameState.phase === 'GAME_OVER') return;
      const p = room.gameState.players.find((x) => x.id === botId);
      if (!p) return;
      // Only announce if still at 2 cards, not yet announced, and not blocked by re-announce rule
      if (p.hand.length !== 2 || p.hasAnnouncedUpDown || p.lastAnnouncedHandSize === 2) return;

      room.gameState = gameReducer(room.gameState, {
        type: 'ANNOUNCE_UP_DOWN',
        playerId: botId,
      });
      emitSFXToRoom(room, 'alert');
      broadcastGameState(room);
    }, delay);

    room.botTimers.set(botId + ':announce', timer);
  }

  function scheduleBotTurn(room: Room) {
    if (!room.gameState || room.gameState.phase === 'GAME_OVER') return;

    const active = getActivePlayer(room.gameState);
    if (!active.isBot) return;

    const difficulty = active.botDifficulty ?? 'medium';
    const delay = Math.max(getBotDelay(difficulty), 1200); // Min 1.2s so players can see cards

    // Clear any existing timer for this room
    const existingTimer = room.botTimers.get(active.id);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      if (!room.gameState || room.gameState.phase === 'GAME_OVER') return;
      const current = getActivePlayer(room.gameState);
      if (current.id !== active.id) return;

      // Bot chooses a card or draws
      const card = botChooseCard(room.gameState, difficulty);

      if (card) {
        room.gameState = gameReducer(room.gameState, {
          type: 'PLAY_CARD',
          playerId: active.id,
          cardId: card.id,
        });

        const lastAction = room.gameState.lastAction ?? '';
        let sfx: SFXType = 'play';
        if (lastAction.includes('ferme')) sfx = 'closure';
        if (room.gameState.phase === 'GAME_OVER') sfx = 'win';
        emitSFXToRoom(room, sfx);
      } else {
        // No playable card → draw
        room.gameState = gameReducer(room.gameState, {
          type: 'DRAW_CARD',
          playerId: active.id,
        });
        emitSFXToRoom(room, 'draw');
      }

      broadcastGameState(room);

      // After playing/drawing, schedule delayed Up & Down announce (gives humans a chance to contre)
      const botAfterAction = room.gameState.players.find((p) => p.id === active.id);
      if (botAfterAction && botAfterAction.hand.length === 2 && !botAfterAction.hasAnnouncedUpDown && botAfterAction.lastAnnouncedHandSize !== 2) {
        scheduleBotAnnounce(room, active.id, difficulty);
      }

      // Trigger contre window if bot is now contrable (for other bots to contre humans)
      const botPlayer = room.gameState.players.find((p) => p.id === active.id);
      if (botPlayer && botPlayer.hand.length > 0 && botPlayer.hand.length <= 2 && !botPlayer.hasAnnouncedUpDown) {
        triggerBotContre(room, active.id);
      }

      // If still bot's turn (double play / closure), schedule again
      if (room.gameState.phase !== 'GAME_OVER') {
        const nextActive = getActivePlayer(room.gameState);
        if (nextActive.isBot) {
          scheduleBotTurn(room);
        }
      }
    }, delay);

    room.botTimers.set(active.id, timer);
  }

  // ── Socket Handlers ──────────────────────────────────

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── List rooms ───────────────────────────────────────
    socket.on('room:list', () => {
      const list: RoomInfo[] = [];
      rooms.forEach((room) => {
        if (!room.isPublic) return; // hide private rooms
        list.push({
          roomId: room.id,
          players: room.players.map((p) => ({ id: p.id, name: p.name })),
          maxPlayers: room.maxPlayers,
          isStarted: room.gameState !== null,
          isPublic: room.isPublic,
        });
      });
      socket.emit('room:list', list);
    });

    // ── Create room ──────────────────────────────────────
    socket.on('room:create', ({ playerName, maxPlayers, settings }) => {
      const roomId = generateRoomCode();
      const playerId = uuidv4();
      const isPublic = settings?.isPublic ?? true;

      const room: Room = {
        id: roomId,
        maxPlayers: Math.min(Math.max(maxPlayers, 2), 8),
        players: [
          { id: playerId, socketId: socket.id, name: playerName, elo: 1000, isBot: false },
        ],
        gameState: null,
        botTimers: new Map(),
        contreTimers: new Map(),
        turnTimer: null,
        turnTickInterval: null,
        isPublic,
        settings,
      };

      rooms.set(roomId, room);
      socket.join(roomId);

      socket.emit('room:info', {
        roomId,
        players: room.players.map((p) => ({ id: p.id, name: p.name })),
        maxPlayers: room.maxPlayers,
        isStarted: false,
        isPublic: room.isPublic,
      });

      (socket as any).playerId = playerId;
      (socket as any).roomId = roomId;

      broadcastRoomList();
    });

    // ── Start Bot Match (Solo vs Bots) ───────────────────
    socket.on('game:startBotMatch', ({ playerName, botCount, botDifficulty, settings }) => {
      const roomId = generateRoomCode();
      const playerId = uuidv4();
      const isPublic = settings?.isPublic ?? true;

      const usedNames = [playerName];
      const botPlayers: RoomPlayer[] = [];
      for (let i = 0; i < Math.min(botCount, 5); i++) {
        const botName = pickBotName(usedNames);
        usedNames.push(botName);
        botPlayers.push({
          id: uuidv4(),
          socketId: 'bot',
          name: botName,
          elo: 1000,
          isBot: true,
          botDifficulty,
        });
      }

      const room: Room = {
        id: roomId,
        maxPlayers: 1 + botCount,
        players: [
          { id: playerId, socketId: socket.id, name: playerName, elo: 1000, isBot: false },
          ...botPlayers,
        ],
        gameState: null,
        botTimers: new Map(),
        contreTimers: new Map(),
        turnTimer: null,
        turnTickInterval: null,
        isPublic,
        settings,
      };

      rooms.set(roomId, room);
      socket.join(roomId);

      (socket as any).playerId = playerId;
      (socket as any).roomId = roomId;

      // Immediately start the game
      room.gameState = createInitialState(roomId, room.players, {
        enableAnnounce: settings?.enableAnnounce ?? true,
        isPublic,
        handSize: settings?.handSize,
        turnTimeLimit: settings?.turnTimeLimit,
        totalRounds: settings?.totalRounds,
      });
      broadcastGameState(room);
      broadcastRoomList();

      // If first player is a bot, start bot turn
      scheduleBotTurn(room);
    });

    // ── Join room ────────────────────────────────────────
    socket.on('room:join', ({ roomId, playerName }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('game:error', 'Salon introuvable.');
        return;
      }
      if (room.gameState) {
        socket.emit('game:error', 'La partie a déjà commencé.');
        return;
      }
      if (room.players.length >= room.maxPlayers) {
        socket.emit('game:error', 'Salon complet.');
        return;
      }

      const playerId = uuidv4();
      room.players.push({
        id: playerId,
        socketId: socket.id,
        name: playerName,
        elo: 1000,
        isBot: false,
      });

      socket.join(roomId);
      (socket as any).playerId = playerId;
      (socket as any).roomId = roomId;

      const info: RoomInfo = {
        roomId,
        players: room.players.map((p) => ({ id: p.id, name: p.name })),
        maxPlayers: room.maxPlayers,
        isStarted: false,
        isPublic: room.isPublic,
      };

      io.to(roomId).emit('room:info', info);
      broadcastRoomList();
    });

    // ── Add bot to room (for testing multiplayer alone) ──
    socket.on('room:addBot', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      if (room.gameState) return;
      if (room.players.length >= room.maxPlayers) return;

      const botName = pickBotName(room.players.map((p) => p.name));
      room.players.push({
        id: uuidv4(),
        socketId: 'bot',
        name: botName,
        elo: 1000,
        isBot: true,
        botDifficulty: 'easy',
      });

      const info: RoomInfo = {
        roomId,
        players: room.players.map((p) => ({ id: p.id, name: p.name })),
        maxPlayers: room.maxPlayers,
        isStarted: false,
        isPublic: room.isPublic,
      };
      io.to(roomId).emit('room:info', info);
      broadcastRoomList();
    });

    // ── Start game ───────────────────────────────────────
    socket.on('game:start', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      if (room.players.length < 2) {
        socket.emit('game:error', 'Il faut au moins 2 joueurs.');
        return;
      }
      if (room.gameState) {
        socket.emit('game:error', 'Partie déjà en cours.');
        return;
      }

      room.gameState = createInitialState(roomId, room.players, {
        handSize: room.settings?.handSize,
        turnTimeLimit: room.settings?.turnTimeLimit,
        totalRounds: room.settings?.totalRounds,
        enableAnnounce: room.settings?.enableAnnounce ?? true,
        isPublic: room.isPublic,
      });
      broadcastGameState(room);
      broadcastRoomList();
      scheduleBotTurn(room);
    });

    // ── Play card ────────────────────────────────────────
    socket.on('game:playCard', ({ roomId, cardId }) => {
      const room = rooms.get(roomId);
      if (!room?.gameState) return;

      const playerId = (socket as any).playerId as string;

      room.gameState = gameReducer(room.gameState, {
        type: 'PLAY_CARD',
        playerId,
        cardId,
      });

      const lastAction = room.gameState.lastAction ?? '';
      let sfx: SFXType = 'play';
      if (lastAction.includes('ferme')) sfx = 'closure';
      if (room.gameState.phase === 'GAME_OVER') sfx = 'win';

      emitSFXToRoom(room, sfx);
      broadcastGameState(room);

      // Check if player became contrable after playing
      const actingPlayer = room.gameState.players.find((p) => p.id === playerId);
      if (actingPlayer && actingPlayer.hand.length > 0 && actingPlayer.hand.length <= 2 && !actingPlayer.hasAnnouncedUpDown) {
        triggerBotContre(room, playerId);
      }

      scheduleBotTurn(room);
    });

    // ── Draw card ────────────────────────────────────────
    socket.on('game:drawCard', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room?.gameState) return;

      const playerId = (socket as any).playerId as string;
      room.gameState = gameReducer(room.gameState, {
        type: 'DRAW_CARD',
        playerId,
      });

      emitSFXToRoom(room, 'draw');
      broadcastGameState(room);

      // Check if player became contrable after drawing
      const actingPlayer = room.gameState.players.find((p) => p.id === playerId);
      if (actingPlayer && actingPlayer.hand.length > 0 && actingPlayer.hand.length <= 2 && !actingPlayer.hasAnnouncedUpDown) {
        triggerBotContre(room, playerId);
      }

      scheduleBotTurn(room);
    });

    // ── Announce ─────────────────────────────────────────
    socket.on('game:announceUpDown', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room?.gameState) return;

      const playerId = (socket as any).playerId as string;
      room.gameState = gameReducer(room.gameState, {
        type: 'ANNOUNCE_UP_DOWN',
        playerId,
      });

      emitSFXToRoom(room, 'alert');
      broadcastGameState(room);
    });

    // ── Contre ───────────────────────────────────────────
    socket.on('game:contre', ({ roomId, targetPlayerId }) => {
      const room = rooms.get(roomId);
      if (!room?.gameState) return;

      const playerId = (socket as any).playerId as string;
      room.gameState = gameReducer(room.gameState, {
        type: 'CONTRE',
        playerId,
        targetPlayerId,
      });

      emitSFXToRoom(room, 'error');
      broadcastGameState(room);
    });

    // ── Reaction emoji ──────────────────────────────────
    socket.on('game:reaction', ({ roomId, emoji }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const playerId = (socket as any).playerId as string;
      const player = room.players.find((p) => p.id === playerId);
      if (!player) return;

      // Broadcast to all players in the room
      room.players.forEach((p) => {
        if (!p.isBot) {
          io.to(p.socketId).emit('game:reaction', {
            playerId,
            playerName: player.name,
            emoji,
          });
        }
      });
    });

    // ── Chat ─────────────────────────────────────────────
    socket.on('game:chat', ({ roomId, message }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const playerId = (socket as any).playerId as string;
      const player = room.players.find((p) => p.id === playerId);
      if (!player) return;

      room.players.forEach((p) => {
        if (!p.isBot) {
          io.to(p.socketId).emit('game:chat', {
            playerId,
            playerName: player.name,
            message,
          });
        }
      });
    });

    // ── Restart game ──────────────────────────────────────
    socket.on('game:restart', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      // Clear bot timers
      room.botTimers.forEach((t) => clearTimeout(t));
      room.botTimers.clear();
      clearBotContreTimers(room);
      clearTurnTimer(room);

      const prev = room.gameState;
      const isTournament = (prev && prev.totalRounds > 1);

      // Build cumulative scores from previous round
      const scores: Record<string, number> = { ...(prev?.scores ?? {}) };
      if (prev?.rankings?.length) {
        prev.rankings.forEach((r) => {
          const points = prev.rankings.length - r.rank + 1; // 1st gets N, last gets 1
          scores[r.playerId] = (scores[r.playerId] ?? 0) + points;
        });
      }

      // Create new game with same players
      room.gameState = createInitialState(roomId, room.players, {
        roundNumber: isTournament ? (prev?.roundNumber ?? 1) + 1 : 1,
        totalRounds: isTournament ? prev!.totalRounds : 0,
        scores,
        handSize: prev?.handSize ?? 7,
        turnTimeLimit: prev?.turnTimeLimit ?? 15,
        enableAnnounce: prev?.enableAnnounce ?? true,
        isPublic: prev?.isPublic ?? true,
      });
      broadcastGameState(room);
      scheduleBotTurn(room);
    });

    // ── Quit game ────────────────────────────────────────
    socket.on('game:quit', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || !room.gameState) return;

      const playerId = (socket as any).playerId;
      if (!playerId) return;

      // Eliminate the player (last place)
      const playerCount = room.gameState.players.length;
      const finishOrder = playerCount; // Last place

      room.gameState = {
        ...room.gameState,
        players: room.gameState.players.map((p) =>
          p.id === playerId ? { ...p, finishOrder } : p
        ),
        eliminatedPlayerIds: [...room.gameState.eliminatedPlayerIds, playerId],
      };

      // Check if only one player remains
      const remainingPlayers = room.gameState.players.filter((p) => p.finishOrder === null);
      if (remainingPlayers.length <= 1) {
        // Game over
        const loser = remainingPlayers[0];
        const loserOrder = room.gameState.players.length;
        const finalPlayers = loser
          ? room.gameState.players.map((p) => (p.id === loser.id ? { ...p, finishOrder: loserOrder } : p))
          : room.gameState.players;
        const finalEliminated = loser ? [...room.gameState.eliminatedPlayerIds, loser.id] : room.gameState.eliminatedPlayerIds;

        const rankings = finalPlayers
          .filter((p) => p.finishOrder !== null)
          .sort((a, b) => a.finishOrder! - b.finishOrder!)
          .map((p) => ({ playerId: p.id, name: p.name, rank: p.finishOrder! }));

        room.gameState = {
          ...room.gameState,
          players: finalPlayers,
          eliminatedPlayerIds: finalEliminated,
          rankings,
          phase: 'GAME_OVER',
          winner: rankings[0]?.playerId ?? playerId,
          lastAction: `${room.gameState.players.find((p) => p.id === playerId)?.name ?? 'Un joueur'} a abandonné la partie.`,
        };
      } else {
        room.gameState.lastAction = `${room.gameState.players.find((p) => p.id === playerId)?.name ?? 'Un joueur'} a abandonné la partie.`;
      }

      // Remove player from room
      room.players = room.players.filter((p) => p.id !== playerId);

      // Clear bot timers for this player
      clearBotContreTimers(room);

      broadcastGameState(room);
      broadcastRoomList();

      // If no human players left, remove room
      if (room.players.filter((p) => !p.isBot).length === 0) {
        room.botTimers.forEach((t) => clearTimeout(t));
        clearTurnTimer(room);
        rooms.delete(roomId);
        broadcastRoomList();
      }
    });

    // ── Reconnect ────────────────────────────────────────
    socket.on('room:reconnect' as any, ({ playerId: reconnectId }: { playerId: string }) => {
      const entry = disconnectedPlayers.get(reconnectId);
      if (!entry) return;

      const room = rooms.get(entry.roomId);
      if (!room) return;

      clearTimeout(entry.timeout);
      disconnectedPlayers.delete(reconnectId);

      // Update socket id in room players
      const rp = room.players.find((p) => p.id === reconnectId);
      if (rp) rp.socketId = socket.id;

      // Update socket id in game state
      if (room.gameState) {
        room.gameState = {
          ...room.gameState,
          players: room.gameState.players.map((p) =>
            p.id === reconnectId ? { ...p, socketId: socket.id, isConnected: true } : p
          ),
        };
      }

      (socket as any).playerId = reconnectId;
      (socket as any).roomId = entry.roomId;
      socket.join(entry.roomId);

      broadcastGameState(room);
      console.log(`[Socket] Reconnected: ${reconnectId} → ${socket.id}`);
    });

    // ── Disconnect ───────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const roomId = (socket as any).roomId as string | undefined;
      const playerId = (socket as any).playerId as string | undefined;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      if (room.gameState && playerId) {
        // Mark as disconnected, allow 30s to reconnect
        room.gameState = {
          ...room.gameState,
          players: room.gameState.players.map((p) =>
            p.socketId === socket.id ? { ...p, isConnected: false } : p
          ),
        };
        broadcastGameState(room);

        const player = room.players.find((p) => p.id === playerId);
        const timeout = setTimeout(() => {
          disconnectedPlayers.delete(playerId);
          // After 30s, if still disconnected, remove from game
        }, 30000);

        disconnectedPlayers.set(playerId, {
          roomId,
          name: player?.name ?? 'Inconnu',
          timeout,
        });
      } else {
        room.players = room.players.filter((p) => p.socketId !== socket.id);
        if (room.players.filter((p) => !p.isBot).length === 0) {
          room.botTimers.forEach((t) => clearTimeout(t));
          clearTurnTimer(room);
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit('room:info', {
            roomId,
            players: room.players.map((p) => ({ id: p.id, name: p.name })),
            maxPlayers: room.maxPlayers,
            isStarted: false,
            isPublic: room.isPublic,
          });
        }
      }
      broadcastRoomList();
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
