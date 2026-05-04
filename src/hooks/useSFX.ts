// ============================================================
// Up and Down – Sound Effects Hook
// Uses Web Audio API to synthesize sounds at runtime (no files needed)
// ============================================================

'use client';

import { useEffect, useCallback } from 'react';
import type { SFXType } from '@/lib/types';
import { useAppStore } from '@/lib/store';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const W = window as unknown as { __audioCtx?: AudioContext };
  if (!W.__audioCtx) {
    W.__audioCtx = new AudioContext();
  }
  return W.__audioCtx;
}

// Helper: create a tone with envelope
function tone(ctx: AudioContext, opts: {
  freq: number;
  type?: OscillatorType;
  duration: number;
  startAt?: number;
  volume?: number;
  attack?: number;
  decay?: number;
  freqEnd?: number;
  destination?: AudioNode;
}) {
  const now = ctx.currentTime;
  const start = (opts.startAt ?? 0) + now;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, start);
  if (opts.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 1), start + opts.duration);
  }
  const vol = opts.volume ?? 0.15;
  const attack = opts.attack ?? 0.01;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, start + opts.duration);
  osc.connect(gain).connect(opts.destination ?? ctx.destination);
  osc.start(start);
  osc.stop(start + opts.duration + 0.05);
}

// Helper: noise burst with filter
function noise(ctx: AudioContext, opts: {
  duration: number;
  startAt?: number;
  volume?: number;
  filterFreq?: number;
  filterQ?: number;
  filterType?: BiquadFilterType;
}) {
  const now = ctx.currentTime;
  const start = (opts.startAt ?? 0) + now;
  const bufferSize = Math.floor(ctx.sampleRate * opts.duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(opts.volume ?? 0.15, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + opts.duration);
  const filter = ctx.createBiquadFilter();
  filter.type = opts.filterType ?? 'bandpass';
  filter.frequency.value = opts.filterFreq ?? 3000;
  filter.Q.value = opts.filterQ ?? 1;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(start);
  src.stop(start + opts.duration + 0.05);
}

function synthesize(sfx: SFXType) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  switch (sfx) {
    case 'play': {
      // Card snap/slap — impact + small pitch sweep
      noise(ctx, { duration: 0.05, volume: 0.25, filterFreq: 2500, filterType: 'highpass' });
      tone(ctx, { freq: 900, type: 'triangle', duration: 0.1, freqEnd: 450, volume: 0.12 });
      tone(ctx, { freq: 1800, type: 'sine', duration: 0.05, volume: 0.05, startAt: 0.01 });
      break;
    }
    case 'draw': {
      // Card slide — quick whoosh + subtle thud
      noise(ctx, { duration: 0.15, volume: 0.18, filterFreq: 2000, filterQ: 0.4, filterType: 'bandpass' });
      tone(ctx, { freq: 300, type: 'sine', duration: 0.12, freqEnd: 180, volume: 0.08, startAt: 0.05 });
      break;
    }
    case 'closure': {
      // Big "thump" — lock/impact
      tone(ctx, { freq: 180, type: 'sawtooth', duration: 0.35, freqEnd: 40, volume: 0.22 });
      tone(ctx, { freq: 80, type: 'sine', duration: 0.4, freqEnd: 30, volume: 0.18 });
      noise(ctx, { duration: 0.1, volume: 0.2, filterFreq: 500, filterType: 'lowpass' });
      // Rising "click" at end
      tone(ctx, { freq: 600, type: 'triangle', duration: 0.15, freqEnd: 1200, volume: 0.08, startAt: 0.15 });
      break;
    }
    case 'alert': {
      // Up-and-down announce — bright triumphant arpeggio
      [659, 784, 988, 1319].forEach((freq, i) => {
        tone(ctx, {
          freq,
          type: 'triangle',
          duration: 0.22,
          volume: 0.13,
          startAt: i * 0.08,
          attack: 0.005,
        });
      });
      // Add a sparkle
      tone(ctx, { freq: 2637, type: 'sine', duration: 0.4, volume: 0.06, startAt: 0.3 });
      break;
    }
    case 'win': {
      // Victory fanfare — major chord arpeggio with sustain
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        tone(ctx, { freq, type: 'triangle', duration: 0.5, volume: 0.12, startAt: i * 0.1 });
        tone(ctx, { freq: freq / 2, type: 'sine', duration: 0.6, volume: 0.08, startAt: i * 0.1 });
      });
      // Sparkles at end
      [2093, 2637, 3136].forEach((freq, i) => {
        tone(ctx, { freq, type: 'sine', duration: 0.3, volume: 0.07, startAt: 0.6 + i * 0.06 });
      });
      break;
    }
    case 'error': {
      // Contre / penalty — harsh buzz
      tone(ctx, { freq: 220, type: 'square', duration: 0.1, volume: 0.12 });
      tone(ctx, { freq: 185, type: 'square', duration: 0.15, volume: 0.12, startAt: 0.1 });
      tone(ctx, { freq: 155, type: 'square', duration: 0.2, volume: 0.1, startAt: 0.2 });
      noise(ctx, { duration: 0.1, volume: 0.1, filterFreq: 800, filterType: 'bandpass' });
      break;
    }
    case 'turn': {
      // Soft ping — your turn
      tone(ctx, { freq: 880, type: 'sine', duration: 0.2, volume: 0.1 });
      tone(ctx, { freq: 1320, type: 'sine', duration: 0.3, volume: 0.06, startAt: 0.05 });
      break;
    }
  }
}

export function useSFX() {
  const dequeueSFX = useAppStore((s) => s.dequeueSFX);
  const sfxQueue = useAppStore((s) => s.sfxQueue);

  useEffect(() => {
    if (sfxQueue.length === 0) return;
    const sfx = dequeueSFX();
    if (sfx) synthesize(sfx);
  }, [sfxQueue, dequeueSFX]);

  const play = useCallback((sfx: SFXType) => {
    synthesize(sfx);
  }, []);

  return { play };
}
