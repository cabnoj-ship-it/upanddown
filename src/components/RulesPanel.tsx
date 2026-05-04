// ============================================================
// Up and Down – Panneau des règles du jeu
// ============================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RulesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        className="fixed top-3 left-14 z-30 w-9 h-9 rounded-full flex items-center justify-center
          bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur text-sm"
      >
        📖
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto
                bg-[#13102a]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl p-5 pb-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
                  Règles du jeu
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/40
                    hover:bg-white/10 transition-all flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Sections */}
              <div className="space-y-4 text-white/70 text-sm leading-relaxed">
                <Section title="🎯 But du jeu">
                  Se débarrasser de toutes ses cartes en premier ! Le dernier joueur avec des cartes en main est le perdant.
                </Section>

                <Section title="🃏 Les cartes">
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-white/90">Cartes numérotées (0 à 12)</strong> — ce sont les cartes de base</li>
                    <li><strong className="text-rose-300">Carte UP ▲</strong> — change le mode en montée et oblige à poser une 2e carte</li>
                    <li><strong className="text-cyan-300">Carte DOWN ▼</strong> — change le mode en descente et oblige à poser une 2e carte</li>
                  </ul>
                </Section>

                <Section title="📏 Comment jouer">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>À votre tour, posez une carte sur la pile centrale</li>
                    <li>En mode <strong className="text-rose-300">UP</strong> : posez une carte de valeur <strong>supérieure ou égale</strong> à la carte du dessus</li>
                    <li>En mode <strong className="text-cyan-300">DOWN</strong> : posez une carte de valeur <strong>inférieure ou égale</strong></li>
                    <li>Si vous ne pouvez pas jouer, vous <strong>piochez</strong> une carte</li>
                  </ul>
                </Section>

                <Section title="🔄 Fermeture de pile">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Poser un <strong className="text-white/90">0</strong> ou un <strong className="text-white/90">doublon</strong> (même valeur que le dessus) ferme la pile</li>
                    <li>La pile est défaussée, la direction s&apos;inverse</li>
                    <li>Vous devez poser une nouvelle carte de base</li>
                  </ul>
                </Section>

                <Section title="⚡ Up & Down !">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Quand il ne vous reste que <strong className="text-white/90">2 cartes</strong>, vous devez annoncer <strong className="text-pink-300">&quot;Up & Down !&quot;</strong></li>
                    <li>Si vous oubliez, les autres joueurs peuvent vous <strong className="text-red-300">contrer</strong> et vous piochez 2 cartes de pénalité</li>
                  </ul>
                </Section>

                <Section title="⏱ Timer">
                  Chaque joueur a <strong className="text-white/90">15 secondes</strong> pour jouer. Si le temps est écoulé, vous piochez automatiquement.
                </Section>

                <Section title="🏆 Classement">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Le 1er à vider sa main est <strong className="text-yellow-300">1er</strong></li>
                    <li>La partie continue jusqu&apos;au dernier joueur</li>
                    <li>Le dernier avec des cartes est le <strong className="text-red-300">perdant</strong></li>
                  </ul>
                </Section>

                <Section title="💡 Astuces">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Gardez vos cartes UP/DOWN pour les moments stratégiques</li>
                    <li>Provoquez des fermetures pour inverser la direction à votre avantage</li>
                    <li>N&apos;oubliez jamais d&apos;annoncer &quot;Up & Down&quot; avec 2 cartes !</li>
                  </ul>
                </Section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-2xl bg-white/3 border border-white/5">
      <h3 className="text-white/90 font-bold text-sm mb-1.5">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
