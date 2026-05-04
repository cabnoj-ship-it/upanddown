// ============================================================
// Up and Down – Lobby Component (Vibrant & Colorful)
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BotDifficulty } from '@/lib/types';
import { useSocket } from '@/hooks/useSocket';
import { useAppStore } from '@/lib/store';
import StatsDisplay from './StatsDisplay';
import RulesPanel from './RulesPanel';

const FLOATING_CARDS = ['0', '5', '12', '▲', '▼', '7', '3', '9', '1', '11', 'UP', 'DN', '6', '2', '8'];
const CARD_COLORS = [
  'from-rose-500 to-pink-600',
  'from-emerald-400 to-teal-600',
  'from-violet-500 to-purple-700',
  'from-amber-400 to-orange-600',
  'from-sky-400 to-blue-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-400 to-green-600',
  'from-cyan-400 to-teal-600',
];

export default function Lobby() {
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'bots' | 'create' | 'join' | 'list'>('bots');
  const [botCount, setBotCount] = useState(2);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [totalRounds, setTotalRounds] = useState(1);
  const [enableAnnounce, setEnableAnnounce] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  const { createRoom, joinRoom, listRooms, startGame, startBotMatch, addBot } = useSocket();
  const { roomInfo, roomList, error, socketConnected, playerName, setPlayerName } = useAppStore();

  useEffect(() => {
    if (socketConnected) listRooms();
  }, [socketConnected, listRooms]);

  // If in a room waiting for game
  if (roomInfo && !roomInfo.isStarted) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full p-4 overflow-hidden">
        <FloatingBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl
            border-2 border-white/20 p-6 shadow-2xl"
        >
          <h2 className="text-2xl font-black text-center bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent mb-1">
            Salon : {roomInfo.roomId}
          </h2>
          <p className="text-white/50 text-xs text-center mb-4">
            Partagez ce code pour inviter des joueurs
          </p>

          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="px-5 py-2.5 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 rounded-2xl
              border border-violet-400/40 text-white font-mono text-2xl tracking-[0.3em] font-black
              shadow-lg shadow-violet-500/10">
              {roomInfo.roomId}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigator.clipboard.writeText(roomInfo.roomId)}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center
                text-white/40 hover:text-white/80 hover:bg-white/10 transition-all text-sm"
              title="Copier le code"
            >
              📋
            </motion.button>
          </div>

          <div className="space-y-2 mb-5">
            <p className="text-white/70 text-sm font-bold">
              Joueurs ({roomInfo.players.length}/{roomInfo.maxPlayers})
            </p>
            {roomInfo.players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl
                  bg-white/5 border border-white/10"
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]}
                  flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                  {p.name[0].toUpperCase()}
                </div>
                <span className="text-white font-semibold text-sm">{p.name}</span>
                {i === 0 && (
                  <span className="ml-auto text-[0.6rem] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full font-bold">
                    HOST
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {roomInfo.players.length >= 2 ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startGame(roomInfo.roomId)}
              className="w-full py-3.5 rounded-2xl font-black text-lg
                bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500
                text-white shadow-xl shadow-emerald-500/30
                hover:shadow-emerald-500/50 transition-all"
            >
              Lancer la partie
            </motion.button>
          ) : (
            <div className="flex flex-col gap-2">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-white/50 text-sm text-center"
              >
                En attente de joueurs...
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => addBot(roomInfo.roomId)}
                className="w-full py-2.5 rounded-2xl font-black text-sm
                  bg-white/5 border border-white/10 text-white/50
                  hover:bg-white/10 hover:text-white/70 transition-all"
              >
                🤖 Ajouter un bot de test
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center h-full p-4 overflow-y-auto overflow-x-hidden">
      <StatsDisplay />
      <FloatingBackground />

      <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-md pt-8 md:pt-16">
        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 150 }}
          className="text-center"
        >
          <motion.h1
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="text-6xl md:text-8xl font-black leading-tight"
          >
            <span className="bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-500 bg-clip-text text-transparent">Up</span>
            <span className="text-white/20 mx-1">&</span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">Down</span>
          </motion.h1>
          <p className="text-white/50 text-sm mt-3 tracking-[0.3em] uppercase font-bold">
            Le jeu de cartes multijoueur
          </p>

          {/* Game description card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-4 rounded-2xl bg-white/3 border border-white/5 max-w-sm mx-auto"
          >
            <p className="text-white/40 text-xs leading-relaxed">
              Jouez vos cartes en montée ou en descente. Fermez la pile avec un 0 ou un doublon. Le premier à vider sa main gagne !
            </p>
            <div className="flex justify-center gap-2 mt-3">
              <span className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-400/20 text-rose-300 text-[0.6rem] font-bold">▲ UP</span>
              <span className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-[0.6rem] font-bold">▼ DOWN</span>
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-300 text-[0.6rem] font-bold">0 = Fermeture</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Connection status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs"
        >
          <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-red-500 animate-pulse'}`} />
          <span className={socketConnected ? 'text-emerald-300/70' : 'text-red-400/70'}>
            {socketConnected ? 'Connecté au serveur' : 'Connexion...'}
          </span>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="px-4 py-2.5 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300 text-sm backdrop-blur"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full"
        >
          <label className="block text-white/60 text-xs font-bold mb-1.5 uppercase tracking-wider">
            Votre pseudo
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Votre pseudo..."
            maxLength={20}
            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border-2 border-white/10
              text-white placeholder:text-white/20 font-semibold text-lg
              focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20
              focus:bg-white/10 transition-all backdrop-blur"
          />
        </motion.div>

        {/* Tabs - Game menu style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-2 w-full"
        >
          {([
            { key: 'bots' as const, label: 'VS Bots', icon: '🤖', desc: 'Solo' },
            { key: 'create' as const, label: 'Créer', icon: '✨', desc: 'Nouveau' },
            { key: 'join' as const, label: 'Rejoindre', icon: '🔗', desc: 'Code' },
            { key: 'list' as const, label: 'Salons', icon: '📋', desc: 'Publics' },
          ]).map((t) => (
            <motion.button
              key={t.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border transition-all
                ${tab === t.key
                  ? 'bg-gradient-to-b from-violet-600/40 to-fuchsia-600/40 border-violet-400/40 text-white shadow-lg shadow-violet-500/15'
                  : 'bg-white/3 border-white/5 text-white/30 hover:text-white/50 hover:bg-white/5'
                }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-[0.6rem] font-black uppercase tracking-wider">{t.label}</span>
              <span className="text-[0.5rem] font-medium opacity-50">{t.desc}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-white/5 backdrop-blur-xl rounded-3xl
              border border-white/10 p-5 shadow-xl"
          >
            {tab === 'bots' && (
              <div className="space-y-5">
                <div className="text-center">
                  <h3 className="text-lg font-black text-white mb-1">Jouer contre des Bots</h3>
                  <p className="text-white/40 text-xs">Entraînez-vous contre l&apos;IA</p>
                </div>

                {/* Bot count */}
                <div>
                  <label className="block text-white/60 text-xs font-bold mb-2 uppercase tracking-wider">
                    Nombre de bots
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <motion.button
                        key={n}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setBotCount(n)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all border
                          ${botCount === n
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400/50 text-white shadow-lg shadow-cyan-500/20'
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                          }`}
                      >
                        {n}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Bot difficulty */}
                <div>
                  <label className="block text-white/60 text-xs font-bold mb-2 uppercase tracking-wider">
                    Difficulté
                  </label>
                  <div className="flex gap-2">
                    {([
                      { key: 'easy' as BotDifficulty, label: 'Facile', color: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/20' },
                      { key: 'medium' as BotDifficulty, label: 'Moyen', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
                      { key: 'hard' as BotDifficulty, label: 'Difficile', color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/20' },
                    ]).map((d) => (
                      <motion.button
                        key={d.key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setBotDifficulty(d.key)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border
                          ${botDifficulty === d.key
                            ? `bg-gradient-to-r ${d.color} border-white/20 text-white shadow-lg ${d.shadow}`
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                          }`}
                      >
                        {d.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Toggle Up & Down */}
                <div className="flex items-center justify-between px-2">
                  <label className="text-white/60 text-xs font-bold uppercase tracking-wider">
                    Mécanique Up & Down
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEnableAnnounce(!enableAnnounce)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${enableAnnounce ? 'bg-violet-600' : 'bg-white/10'}`}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white shadow-md"
                      animate={{ x: enableAnnounce ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!playerName.trim()) return;
                    startBotMatch(playerName.trim(), botCount, botDifficulty, {
                      enableAnnounce,
                      isPublic: true,
                      handSize: 5,
                      turnTimeLimit: 15,
                      totalRounds,
                    });
                  }}
                  disabled={!playerName.trim() || !socketConnected}
                  className="w-full py-4 rounded-2xl font-black text-lg
                    bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600
                    text-white shadow-xl shadow-fuchsia-500/30
                    hover:shadow-fuchsia-500/50 transition-all
                    disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Lancer la partie !
                </motion.button>
              </div>
            )}

            {tab === 'create' && (
              <div className="space-y-5">
                <div className="text-center">
                  <h3 className="text-lg font-black text-white mb-1">Créer un salon</h3>
                  <p className="text-white/40 text-xs">Invitez vos amis avec un code</p>
                </div>

                <div>
                  <label className="block text-white/60 text-xs font-bold mb-2 uppercase tracking-wider">
                    Joueurs max
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <motion.button
                        key={n}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMaxPlayers(n)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all border
                          ${maxPlayers === n
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400/50 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                          }`}
                      >
                        {n}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-xs font-bold mb-2 uppercase tracking-wider">
                    Manches
                  </label>
                  <div className="flex gap-2">
                    {[
                      { n: 1, label: '1 partie' },
                      { n: 3, label: '3 manches' },
                      { n: 5, label: '5 manches' },
                    ].map(({ n, label }) => (
                      <motion.button
                        key={n}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTotalRounds(n)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all border
                          ${totalRounds === n
                            ? 'bg-gradient-to-r from-pink-500 to-rose-600 border-pink-400/50 text-white shadow-lg shadow-pink-500/20'
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                          }`}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Toggle Up & Down */}
                <div className="flex items-center justify-between px-2">
                  <label className="text-white/60 text-xs font-bold uppercase tracking-wider">
                    Mécanique Up & Down
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEnableAnnounce(!enableAnnounce)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${enableAnnounce ? 'bg-violet-600' : 'bg-white/10'}`}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white shadow-md"
                      animate={{ x: enableAnnounce ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>

                {/* Toggle Public/Privé */}
                <div className="flex items-center justify-between px-2">
                  <label className="text-white/60 text-xs font-bold uppercase tracking-wider">
                    Salon public
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${isPublic ? 'bg-emerald-600' : 'bg-white/10'}`}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white shadow-md"
                      animate={{ x: isPublic ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!playerName.trim()) return;
                    createRoom(playerName.trim(), maxPlayers, {
                      totalRounds,
                      handSize: 7,
                      turnTimeLimit: 15,
                      enableAnnounce,
                      isPublic,
                    });
                  }}
                  disabled={!playerName.trim() || !socketConnected}
                  className="w-full py-4 rounded-2xl font-black text-lg
                    bg-gradient-to-r from-amber-500 via-orange-500 to-red-500
                    text-white shadow-xl shadow-orange-500/30
                    hover:shadow-orange-500/50 transition-all
                    disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Créer un salon
                </motion.button>
              </div>
            )}

            {tab === 'join' && (
              <div className="space-y-5">
                <div className="text-center">
                  <h3 className="text-lg font-black text-white mb-1">Rejoindre un salon</h3>
                  <p className="text-white/40 text-xs">Entrez le code du salon</p>
                </div>

                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE DU SALON"
                  maxLength={6}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border-2 border-white/10
                    text-white placeholder:text-white/20 font-mono text-xl tracking-[0.2em] text-center
                    focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                    transition-all uppercase"
                />

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!playerName.trim() || !joinCode.trim()) return;
                    joinRoom(joinCode.trim(), playerName.trim());
                  }}
                  disabled={!playerName.trim() || !joinCode.trim() || !socketConnected}
                  className="w-full py-4 rounded-2xl font-black text-lg
                    bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500
                    text-white shadow-xl shadow-emerald-500/30
                    hover:shadow-emerald-500/50 transition-all
                    disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Rejoindre
                </motion.button>
              </div>
            )}

            {tab === 'list' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white">Salons ouverts</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={listRooms}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white text-sm"
                  >
                    ↻
                  </motion.button>
                </div>

                {roomList.filter((r) => !r.isStarted).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2 opacity-30">🃏</div>
                    <p className="text-white/30 text-sm">Aucun salon disponible</p>
                  </div>
                ) : (
                  roomList
                    .filter((r) => !r.isStarted)
                    .map((room, i) => (
                      <motion.div
                        key={room.roomId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-4 py-3 rounded-xl
                          bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div>
                          <span className="text-white font-mono text-sm font-bold">
                            {room.roomId}
                          </span>
                          <span className="text-white/30 text-xs ml-2">
                            {room.players.length}/{room.maxPlayers}
                          </span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (!playerName.trim()) return;
                            joinRoom(room.roomId, playerName.trim());
                          }}
                          disabled={!playerName.trim() || room.players.length >= room.maxPlayers}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold
                            bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white
                            shadow-md shadow-violet-500/20
                            disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Rejoindre
                        </motion.button>
                      </motion.div>
                    ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rules panel accessible from lobby */}
      <RulesPanel />
    </div>
  );
}

// ── Floating Background Cards ──────────────────────────────
// Rendered only after mount to avoid SSR hydration mismatch from Math.random()

function FloatingBackground() {
  const [cards, setCards] = useState<
    { val: string; color: string; x: number; y: number; rot: number; ax: number; ay: number; ar: number; dur: number }[]
  >([]);

  useEffect(() => {
    setCards(
      FLOATING_CARDS.map((val, i) => ({
        val,
        color: CARD_COLORS[i % CARD_COLORS.length],
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        rot: Math.random() * 360,
        ax: Math.random() * 60 - 30,
        ay: Math.random() * 80 - 40,
        ar: Math.random() * 20 - 10,
        dur: 6 + Math.random() * 4,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]" />

        {/* Floating cards (client-only) */}
      {cards.map((c, i) => (
        <motion.div
          key={i}
          initial={{ x: c.x, y: c.y, rotate: c.rot, opacity: 0 }}
          animate={{
            y: [c.y, c.y + c.ay, c.y - c.ay],
            x: [c.x, c.x + c.ax, c.x - c.ax],
            rotate: [c.rot, c.rot + c.ar, c.rot - c.ar],
            opacity: 0.12,
          }}
          transition={{
            duration: c.dur,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
          className={`absolute w-14 h-20 md:w-16 md:h-24 rounded-xl bg-gradient-to-br ${c.color}
            flex items-center justify-center text-white font-black text-lg md:text-xl
            shadow-xl border-2 border-white/15`}
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
        >
          <div className="absolute inset-1 rounded-lg border border-white/10" />
          <span className="relative z-10 drop-shadow-lg">{c.val}</span>
        </motion.div>
      ))}
    </div>
  );
}
