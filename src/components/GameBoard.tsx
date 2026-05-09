// ============================================================
// Up and Down – Professional Game Board (Casino Style)
// ============================================================

'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { useAppStore } from '@/lib/store';
import { useSFX } from '@/hooks/useSFX';
import CenterPile from './CenterPile';
import PlayerHand from './PlayerHand';
import PlayerInfo from './PlayerInfo';
import HistoryPanel from './HistoryPanel';
import Card from './Card';
import { ReactionBar, FloatingReactions } from './ReactionBar';
import StatsPanel from './StatsPanel';
import RulesPanel from './RulesPanel';
import { recordGameResult, getBadgeLabel } from '@/lib/playerStats';
import { triggerWinConfetti, triggerClosureBurst } from './VFX';
import QuickChat from './QuickChat';
import FloatingChat from './FloatingChat';
import TutorialOverlay from './TutorialOverlay';
import ActionToast from './ActionToast';
import VoiceControl from './VoiceControl';
import TableBackground from './TableBackground';
import OpponentSeat from './OpponentSeat';

export default function GameBoard() {
  const { playCard, drawCard, announceUpDown, contre, restartGame, quitGame, sendReaction, sendChat } = useSocket();
  const { gameState, playerId, reset, cardTheme, setCardTheme } = useAppStore();
  const { play: playSFX } = useSFX();

  const me = useMemo(
    () => gameState?.players.find((p) => p.id === playerId),
    [gameState, playerId]
  );

  const opponents = useMemo(
    () => gameState?.players.filter((p) => p.id !== playerId) ?? [],
    [gameState, playerId]
  );

  const isMyTurn = useMemo(
    () =>
      gameState
        ? gameState.players[gameState.activePlayerIndex]?.id === playerId
        : false,
    [gameState, playerId]
  );

  const activePlayer = gameState?.players[gameState.activePlayerIndex];

  // Enregistrer les stats quand la partie se termine
  const [statsRecorded, setStatsRecorded] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    if (gameState?.phase === 'GAME_OVER' && !statsRecorded && playerId && gameState.rankings?.length > 0) {
      const myRank = gameState.rankings.find((r) => r.playerId === playerId);
      if (myRank) {
        // Compter les cartes jouées, fermetures et contres depuis l'historique
        const cardsPlayed = gameState.history.filter((a) => a.type === 'PLAY_CARD' && a.playerId === playerId).length;
        const closures = gameState.history.filter(
          (a) => a.type === 'PLAY_CARD' && a.playerId === playerId && a.card?.value === 0
        ).length;
        const contresGiven = gameState.history.filter(
          (a) => a.type === 'CONTRE' && a.playerId === playerId
        ).length;
        const contresReceived = gameState.history.filter(
          (a) => a.type === 'CONTRE' && gameState.players.find(p => p.id === a.playerId) === undefined // target is tricky
        ).length; // simplification
        const result = recordGameResult(myRank.rank, gameState.players.length, cardsPlayed, closures, contresGiven, 0);
        setNewBadges(result.newBadges);
        setStatsRecorded(true);
      }
    }
    if (gameState?.phase !== 'GAME_OVER') {
      setStatsRecorded(false);
      setNewBadges([]);
    }

    // Confetti on game over if player won (rank 1 or 2)
    if (gameState?.phase === 'GAME_OVER' && playerId) {
      const myRank = gameState.rankings?.find((r) => r.playerId === playerId)?.rank;
      if (myRank && myRank <= 2) {
        triggerWinConfetti();
      }
    }

    // Explosion effect on closure
    if (gameState?.lastAction?.includes('ferme')) {
      triggerClosureBurst(0.5, 0.4);
    }
  }, [gameState, playerId, statsRecorded]);

  // 1s cooldown after any card is played (to see the card on the pile)
  const [actionCooldown, setActionCooldown] = useState(false);
  const prevPileLen = useMemo(() => gameState?.centerPile.length ?? 0, [gameState?.centerPile.length]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prevActiveIdx = useMemo(() => gameState?.activePlayerIndex, [gameState?.activePlayerIndex]);

  useEffect(() => {
    // When center pile changes (a card was played), activate cooldown
    if (gameState && gameState.centerPile.length > 0) {
      setActionCooldown(true);
      const t = setTimeout(() => setActionCooldown(false), 1000);
      return () => clearTimeout(t);
    }
  }, [gameState?.centerPile.length, gameState?.activePlayerIndex]);

  if (!gameState || !me) return null;

  const handlePlayCard = (cardId: string) => {
    if (actionCooldown) return;
    playSFX('play');
    playCard(gameState.roomId, cardId);
  };

  const handleDraw = () => {
    if (actionCooldown) return;
    playSFX('draw');
    drawCard(gameState.roomId);
  };

  const handleAnnounce = () => {
    playSFX('alert');
    announceUpDown(gameState.roomId);
  };

  const handleContre = (targetId: string) => {
    contre(gameState.roomId, targetId);
  };

  const canDraw = isMyTurn && !gameState.doublePlayPending && !gameState.closurePlayPending;
  const turnSecondsLeft = useAppStore((s) => s.turnSecondsLeft);
  const lastPlayed = gameState.lastPlayedCardInfo;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden select-none">
      {/* Felt table background */}
      <TableBackground />

      {/* TOP BAR — Professional header with opponents */}
      <div className="relative z-10 shrink-0 pt-2 pb-1.5 px-2">
        {/* Tournament info bar */}
        {gameState.totalRounds > 1 && (
          <div className="flex items-center justify-center mb-2">
            <div className="px-3 py-1 rounded-lg bg-amber-400/15 border border-amber-300/40 backdrop-blur-sm">
              <span className="text-amber-200 text-[0.65rem] font-black tracking-wider">
                Manche {gameState.roundNumber} / {gameState.totalRounds}
              </span>
            </div>
          </div>
        )}

        {/* Opponents row */}
        <div className="flex items-start justify-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {opponents.map((opp) => (
            <OpponentSeat
              key={opp.id}
              opponent={opp}
              isActive={activePlayer?.id === opp.id}
              gameState={gameState}
              onContre={() => handleContre(opp.id)}
            />
          ))}
        </div>

        {/* Tournament scores */}
        {gameState.totalRounds > 1 && (
          <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className={`px-2 py-0.5 rounded-md border text-[0.6rem] font-bold
                  ${p.id === playerId
                    ? 'bg-amber-400/20 border-amber-300/50 text-amber-200'
                    : 'bg-black/30 border-white/5 text-white/50'
                  }`}
              >
                {p.name.slice(0, 5)}: <span className="font-black">{gameState.scores[p.id] ?? 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CENTER — Table (Draw pile + Discard pile) */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative z-10 gap-3 px-3">
        {/* Timer */}
        {turnSecondsLeft !== null && turnSecondsLeft <= 15 && gameState.phase !== 'GAME_OVER' && (
          <motion.div
            key={turnSecondsLeft}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className={`absolute top-2 px-3 py-1 rounded-full font-black text-xs border-2 backdrop-blur
              ${turnSecondsLeft <= 5
                ? 'bg-red-500/30 border-red-300/60 text-red-100'
                : turnSecondsLeft <= 10
                  ? 'bg-amber-500/25 border-amber-300/50 text-amber-100'
                  : 'bg-white/10 border-white/20 text-white/80'
              }`}
          >
            ⏱ {turnSecondsLeft}s
          </motion.div>
        )}

        <CenterPile
          gameState={gameState}
          onDraw={handleDraw}
          canDraw={canDraw}
        />

        {/* Phase indicators */}
        <AnimatePresence>
          {gameState.doublePlayPending && isMyTurn && (
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              className="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600
                border-2 border-rose-300/60 text-white text-xs font-black shadow-xl shadow-rose-500/40"
            >
              🎯 Posez une seconde carte !
            </motion.div>
          )}

          {gameState.closurePlayPending && isMyTurn && (
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              className="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600
                border-2 border-cyan-300/60 text-white text-xs font-black shadow-xl shadow-cyan-500/40"
            >
              🔒 Pile fermée — Nouvelle base !
            </motion.div>
          )}
        </AnimatePresence>

        {/* Your turn banner (subtle, top of hand area) */}
        {isMyTurn && !gameState.doublePlayPending && !gameState.closurePlayPending && gameState.phase !== 'GAME_OVER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="absolute bottom-2 flex items-center gap-1.5 px-3 py-1 rounded-full
              bg-emerald-500/20 border border-emerald-400/40 backdrop-blur"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-200 text-[0.65rem] font-black tracking-wider">À VOUS DE JOUER</span>
          </motion.div>
        )}
      </div>

      {/* BOTTOM — Action bar + My hand */}
      <div className="relative z-10 shrink-0 pb-2">
        {/* Action bar (contextual buttons) */}
        <div className="flex items-center justify-between px-3 pb-1.5 gap-2 overflow-x-auto no-scrollbar">
          {/* My player pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-white/10 backdrop-blur-sm">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700
              flex items-center justify-center text-white font-black text-xs shadow-md border-2
              ${isMyTurn ? 'border-amber-400/60 ring-2 ring-amber-400/30' : 'border-white/10'}`}
            >
              {me.name[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[0.65rem] font-bold text-white/90 truncate max-w-[4.5rem]">
                {me.name}
              </span>
              <span className="text-[0.6rem] text-white/50 font-bold">
                {me.hand.length} 🃏
              </span>
            </div>
            {me.hasAnnouncedUpDown && (
              <span className="px-1.5 py-0.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[0.5rem] font-black rounded-md shadow-md">
                U&D
              </span>
            )}
          </div>

          {/* Announce button (professional when needed) */}
          {gameState.enableAnnounce && me.hand.length === 2 && !me.hasAnnouncedUpDown && me.lastAnnouncedHandSize !== 2 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAnnounce}
              className="px-4 py-2 rounded-xl font-black text-sm
                bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-700
                text-white shadow-lg shadow-rose-500/30
                border border-rose-300/50"
            >
              🚀 UP & DOWN
            </motion.button>
          )}

          {/* Right-side controls */}
          <div className="flex items-center gap-1.5">
            <VoiceControl />
            <ReactionBar onReact={(emoji) => sendReaction(gameState.roomId, emoji)} />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (confirm('Voulez-vous vraiment abandonner la partie ?')) {
                  quitGame(gameState.roomId);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg font-black text-[0.65rem]
                bg-slate-700/40 border border-slate-500/30 text-slate-300
                hover:bg-slate-700/60 transition-all"
              title="Abandonner"
            >
              ❌
            </motion.button>
          </div>
        </div>

        {/* Hand */}
        <PlayerHand
          cards={me.hand}
          gameState={gameState}
          isMyTurn={isMyTurn}
          onPlayCard={handlePlayCard}
        />
      </div>

      {/* Game Over overlay with rankings */}
      <AnimatePresence>
        {gameState.phase === 'GAME_OVER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.5, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-center p-6 rounded-3xl max-w-sm mx-4 w-full
                bg-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-5xl mb-2"
              >
                🏆
              </motion.div>
              <h2 className="text-xl font-black mb-4 bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                {gameState.totalRounds > 1 && gameState.roundNumber < gameState.totalRounds
                  ? `Manche ${gameState.roundNumber} / ${gameState.totalRounds}`
                  : gameState.totalRounds > 1
                    ? 'Tournoi terminé !'
                    : 'Classement final'}
              </h2>

              <div className="space-y-2 mb-5">
                {(gameState.rankings ?? []).map((r, i) => {
                  const isMe = r.playerId === playerId;
                  const isLast = r.rank === gameState.players.length;
                  const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : '';
                  return (
                    <motion.div
                      key={r.playerId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.12 }}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all
                        ${isLast
                          ? 'bg-red-500/10 border-red-400/30'
                          : r.rank === 1
                            ? 'bg-yellow-500/10 border-yellow-400/30'
                            : 'bg-white/5 border-white/10'
                        }
                        ${isMe ? 'ring-1 ring-violet-400/40' : ''}
                      `}
                    >
                      <span className="text-lg w-8 text-center">{medal || `#${r.rank}`}</span>
                      <span className={`flex-1 text-left font-bold text-sm truncate
                        ${r.rank === 1 ? 'text-yellow-300' : isLast ? 'text-red-300' : 'text-white/70'}`}
                      >
                        {r.name}
                        {isMe && <span className="text-violet-400 text-[0.6rem] ml-1">(Vous)</span>}
                      </span>
                      {isLast && (
                        <span className="text-red-400/60 text-[0.6rem] font-bold">Perdant</span>
                      )}
                      {r.rank === 1 && (
                        <span className="text-yellow-400/80 text-[0.6rem] font-bold">Vainqueur</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Nouveaux succès */}
              {newBadges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mb-4 p-3 rounded-2xl bg-violet-500/10 border border-violet-400/20"
                >
                  <div className="text-violet-300 text-[0.6rem] font-bold uppercase tracking-wider mb-1.5">Nouveau succès !</div>
                  {newBadges.map((b) => (
                    <div key={b} className="text-sm font-bold text-violet-200">
                      🏅 {getBadgeLabel(b)}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Restart + Quit buttons */}
              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => restartGame(gameState.roomId)}
                  className="px-5 py-2.5 rounded-2xl font-black text-xs
                    bg-gradient-to-r from-violet-600 to-indigo-700
                    border border-violet-400/40 text-white
                    shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all"
                >
                  {gameState.totalRounds > 1 && gameState.roundNumber < gameState.totalRounds
                    ? 'Manche suivante'
                    : gameState.totalRounds > 1
                      ? 'Rejouer'
                      : 'Recommencer'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => { reset(); }}
                  className="px-5 py-2.5 rounded-2xl font-black text-xs
                    bg-white/5 border border-white/15 text-white/60
                    hover:bg-white/10 hover:text-white/80 transition-all backdrop-blur"
                >
                  Quitter
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating reactions & chat */}
      <FloatingReactions />
      <FloatingChat />

      {/* Quick Chat + Stats + Rules panels */}
      <div className="fixed bottom-3 right-3 z-30 flex flex-col gap-2">
        <QuickChat onSend={(msg) => gameState && sendChat(gameState.roomId, msg)} />
      </div>

      {/* Theme switcher */}
      <div className="fixed top-3 left-24 z-30">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            const themes: ('neon' | 'classic' | 'dark')[] = ['neon', 'classic', 'dark'];
            const idx = themes.indexOf(cardTheme);
            setCardTheme(themes[(idx + 1) % themes.length]);
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center
            bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur text-sm"
          title={`Thème: ${cardTheme}`}
        >
          {cardTheme === 'neon' ? '🌈' : cardTheme === 'classic' ? '🃏' : '🌙'}
        </motion.button>
      </div>

      {/* Stats + Rules panels */}
      <StatsPanel />
      <RulesPanel />

      {/* History panel */}
      <HistoryPanel />

      {/* Tutorial for first-time players */}
      <TutorialOverlay />

      {/* Action toasts (contre, announce, closure, win) */}
      <ActionToast lastAction={gameState.lastAction} />
    </div>
  );
}
