// ============================================================
// Up and Down – Tutorial Overlay (First-time players)
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    title: 'Bienvenue !',
    text: 'Jouez vos cartes sur la pile centrale. En mode UP, posez une carte plus haute. En mode DOWN, plus basse.',
  },
  {
    title: 'Fermeture de pile',
    text: 'Un 0 ou un doublon (même valeur) ferme la pile ! La direction s\'inverse et vous devez poser une nouvelle base.',
  },
  {
    title: 'Up & Down !',
    text: 'Quand il ne vous reste que 2 cartes, appuyez sur "Up & Down !". Sinon, les adversaires peuvent vous contrer !',
  },
  {
    title: 'Cartes spéciales',
    text: 'UP ▲ force le mode montée et une seconde carte. DOWN ▼ force le mode descente et une seconde carte.',
  },
  {
    title: 'C\'est parti !',
    text: 'Vous avez 15 secondes par tour. Bonne chance et amusez-vous ! 🎉',
  },
];

export default function TutorialOverlay() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = localStorage.getItem('upanddown_tutorial_seen');
    if (!seen) setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem('upanddown_tutorial_seen', 'true'); } catch {}
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            key={step}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-sm bg-[#1a1338] border border-white/10 rounded-3xl p-6 shadow-2xl"
          >
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">📖</div>
              <h3 className="text-lg font-black text-white">{STEPS[step].title}</h3>
            </div>
            <p className="text-white/60 text-sm text-center leading-relaxed mb-6">
              {STEPS[step].text}
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-violet-400 w-4' : 'bg-white/20'}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              {step > 0 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
                >
                  Précédent
                </motion.button>
              )}
              {step < STEPS.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep(step + 1)}
                  className="flex-1 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20"
                >
                  Suivant
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={dismiss}
                  className="flex-1 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                >
                  Jouer !
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
