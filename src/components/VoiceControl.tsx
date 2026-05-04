// ============================================================
// Up and Down – Voice Chat Control (mic toggle + settings)
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useVoiceChat } from '@/hooks/useVoiceChat';

export default function VoiceControl() {
  // Activate the voice chat hook
  useVoiceChat();

  const {
    voiceEnabled,
    voiceConnected,
    voiceMutedSelf,
    voiceInputDevice,
    setVoiceEnabled,
    setVoiceMutedSelf,
    setVoiceInputDevice,
  } = useAppStore();

  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (!showSettings) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((list) => setDevices(list.filter((d) => d.kind === 'audioinput')))
      .catch(() => setDevices([]));
  }, [showSettings]);

  const toggleVoice = () => {
    if (!voiceEnabled) {
      // Request permission by enabling
      setVoiceEnabled(true);
    } else {
      setVoiceEnabled(false);
    }
  };

  const toggleMuteSelf = () => {
    setVoiceMutedSelf(!voiceMutedSelf);
  };

  return (
    <>
      {/* Main mic button */}
      <div className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleVoice}
          className={`px-2.5 py-1.5 rounded-xl font-black text-[0.6rem] border transition-all
            ${voiceEnabled && voiceConnected
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
            }`}
          title={voiceEnabled ? 'Désactiver le vocal' : 'Activer le vocal'}
        >
          {voiceEnabled && voiceConnected ? '🎙️ ON' : '🎙️ OFF'}
        </motion.button>

        {voiceEnabled && voiceConnected && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMuteSelf}
            className={`px-2 py-1.5 rounded-xl font-black text-[0.6rem] border transition-all
              ${voiceMutedSelf
                ? 'bg-red-500/20 border-red-400/40 text-red-300'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            title={voiceMutedSelf ? 'Réactiver micro' : 'Couper micro'}
          >
            {voiceMutedSelf ? '🔇' : '🎤'}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(!showSettings)}
          className="px-2 py-1.5 rounded-xl text-[0.6rem] border bg-white/5 border-white/10 text-white/40 hover:text-white/70"
          title="Paramètres vocal"
        >
          ⚙️
        </motion.button>
      </div>

      {/* Settings modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm mx-4 p-5 rounded-3xl
                bg-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(false)}
                className="absolute top-3 right-3 text-white/50 hover:text-white text-xl"
              >
                ✕
              </motion.button>

              <h3 className="text-lg font-black mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                🎙️ Paramètres vocal
              </h3>

              {/* Toggle voice */}
              <div className="flex items-center justify-between mb-4">
                <label className="text-white/70 text-sm font-bold">Activer le vocal</label>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${voiceEnabled ? 'bg-emerald-600' : 'bg-white/10'}`}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ x: voiceEnabled ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>

              {/* Device selector */}
              <div className="mb-4">
                <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-wider">
                  Microphone
                </label>
                <select
                  value={voiceInputDevice ?? ''}
                  onChange={(e) => setVoiceInputDevice(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10
                    text-white text-sm focus:border-emerald-400/60 focus:outline-none"
                >
                  <option value="">Par défaut</option>
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Micro ${d.deviceId.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
                <p className="text-white/40 text-[0.6rem] mt-1">
                  Autorisez l&apos;accès au micro pour voir les appareils.
                </p>
              </div>

              {/* Status */}
              <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-xs text-white/60">
                <div className="flex justify-between mb-1">
                  <span>État</span>
                  <span className={voiceConnected ? 'text-emerald-400 font-bold' : 'text-white/40'}>
                    {voiceConnected ? 'Connecté' : 'Déconnecté'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Micro</span>
                  <span className={voiceMutedSelf ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {voiceMutedSelf ? 'Coupé' : 'Actif'}
                  </span>
                </div>
              </div>

              <p className="text-white/40 text-[0.65rem] mt-3 text-center">
                💡 Le vocal utilise WebRTC (pair-à-pair, gratuit).
                <br />Idéal pour 2 à 6 joueurs.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
