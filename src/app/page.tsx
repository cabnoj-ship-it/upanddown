'use client';

import { useAppStore } from '@/lib/store';
import Lobby from '@/components/Lobby';
import GameBoard from '@/components/GameBoard';

export default function Home() {
  const gameState = useAppStore((s) => s.gameState);

  return (
    <main className="fixed inset-0 overflow-hidden">
      {gameState ? <GameBoard /> : <Lobby />}
    </main>
  );
}
