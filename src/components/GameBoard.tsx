// ============================================================
// Up and Down – Game Board (Vibrant & Colorful)
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
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 25%, #1c1250 50%, #16132e 75%, #0f0c29 100%)',
      }}
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-violet-600/15 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-cyan-600/10 rounded-full blur-[90px]" />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-rose-600/8 rounded-full blur-[60px]" />
      </div>

      {/* Top – Opponents (compact) */}
      <div className="relative z-10 shrink-0 flex flex-wrap justify-center gap-2 px-2 pt-2 pb-1">
        {opponents.map((opp) => (
          <div key={opp.id} className="flex flex-col items-center gap-0.5">
            {/* Carte jouée par cet adversaire */}
            <AnimatePresence mode="wait">
              {lastPlayed && lastPlayed.playerId === opp.id && (
                <motion.div
                  key={lastPlayed.card.id}
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Card card={lastPlayed.card} size="sm" disabled />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-1.5">
              <PlayerInfo
                player={opp}
                isActive={activePlayer?.id === opp.id}
                isMe={false}
                showContre
                onContre={() => handleContre(opp.id)}
                gameState={gameState}
              />
              <div className="flex -space-x-3">
                {opp.hand.slice(0, 5).map((c, i) => (
                  <Card key={c.id + i} card={c} faceDown={c.id === 'hidden'} size="sm" disabled index={i} />
                ))}
                {opp.hand.length > 5 && (
                  <span className="text-white/30 text-[0.6rem] self-center ml-1 font-bold">
                    +{opp.hand.length - 5}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle – Center zone (takes remaining space) */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative z-10 gap-2 px-3">
        {/* Tournament info */}
        {gameState.totalRounds > 1 && (
          <div className="flex flex-col items-center gap-1">
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-black">
              Manche {gameState.roundNumber} / {gameState.totalRounds}
            </div>
            <div className="flex gap-2">
              {gameState.players.map((p) => (
                <div key={p.id} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/3 border border-white/5 text-[0.6rem] font-bold text-white/50">
                  <span className="truncate max-w-[3rem]">{p.name}</span>
                  <span className="text-amber-300/80">{gameState.scores[p.id] ?? 0}pt</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timer */}
        {turnSecondsLeft !== null && turnSecondsLeft <= 15 && gameState.phase !== 'GAME_OVER' && (
          <motion.div
            key={turnSecondsLeft}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`px-3 py-1 rounded-full font-black text-xs border
              ${turnSecondsLeft <= 5
                ? 'bg-red-500/20 border-red-400/40 text-red-300'
                : turnSecondsLeft <= 10
                  ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/40'
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

        {/* Last action */}
        <AnimatePresence mode="wait">
          {gameState.lastAction && (
            <motion.div
              key={gameState.lastAction}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="px-3 py-1 rounded-full bg-white/5 backdrop-blur border border-white/10
                text-white/60 text-xs font-medium text-center max-w-[70vw] truncate"
            >
              {gameState.lastAction}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase indicators */}
        {gameState.doublePlayPending && isMyTurn && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-rose-600/30 to-pink-600/30
              border border-rose-400/40 text-rose-200 text-xs font-black backdrop-blur"
          >
            Posez une seconde carte !
          </motion.div>
        )}

        {gameState.closurePlayPending && isMyTurn && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30
              border border-cyan-400/40 text-cyan-200 text-xs font-black backdrop-blur"
          >
            Pile fermée ! Posez une nouvelle base.
          </motion.div>
        )}

      </div>

      {/* Bottom – My info + Hand (fixed height) */}
      <div className="relative z-10 shrink-0 px-2 pb-2">
        {/* My info bar */}
        <div className="flex items-center justify-between px-2 py-1 gap-2">
          <PlayerInfo
            player={me}
            isActive={isMyTurn}
            isMe
          />

          {/* Announce button */}
          {gameState.enableAnnounce && me.hand.length === 2 && !me.hasAnnouncedUpDown && isMyTurn && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAnnounce}
              className="px-4 py-2.5 rounded-2xl font-black text-xs
                bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-600
                text-white shadow-lg shadow-pink-500/30
                hover:shadow-pink-500/50 transition-all"
            >
              Up & Down !
            </motion.button>
          )}

          {/* Reactions */}
          <ReactionBar onReact={(emoji) => sendReaction(gameState.roomId, emoji)} />

          {/* Quit button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (confirm('Voulez-vous vraiment abandonner la partie ?')) {
                quitGame(gameState.roomId);
              }
            }}
            className="px-3 py-1.5 rounded-xl font-black text-[0.6rem]
              bg-red-500/20 border border-red-400/30 text-red-300
              hover:bg-red-500/30 hover:text-red-200 transition-all"
          >
            ❌ Abandonner
          </motion.button>

          {/* Turn indicator */}
          {isMyTurn && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full
                bg-emerald-500/20 border border-emerald-400/30"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              <span className="text-emerald-300 text-[0.6rem] font-bold">Votre tour</span>
            </motion.div>
          )}
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
    </div>
  );
}
