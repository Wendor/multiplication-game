import { useProgressStore } from '../stores/progress';

// 1. Описываем, что у window может быть webkitAudioContext
// Это уберет ошибку "Unexpected any"
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

// Переменные вне функции (Singleton)
let audioCtx: AudioContext | null = null;
let lastPlayedTime = 0;

export function useAudio() {
  const progress = useProgressStore();

  const initAudio = () => {
    if (typeof window === 'undefined') return;

    if (!audioCtx) {
      // 2. Используем наш тип WindowWithWebkit вместо any
      const AudioContext = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => { });
    }
  };

  const playTone = (freq: number, type: 'sine' | 'square' | 'triangle', duration: number, volume = 0.1) => {
    if (progress.isMuted) return;

    const now = Date.now();
    if (now - lastPlayedTime < 50) return;
    lastPlayedTime = now;

    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.error('Audio play error:', e);
    }
  };

  const playCorrect = () => {
    playTone(600, 'sine', 0.1);
    if (audioCtx) {
      setTimeout(() => {
        if (!audioCtx || progress.isMuted) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      }, 100);
    }
  };

  const playWrong = () => {
    playTone(150, 'square', 0.2, 0.15);
  };

  const playWin = () => {
    if (progress.isMuted) return;
    initAudio();
    if (!audioCtx) return;

    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!audioCtx || progress.isMuted) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }, i * 150);
    });
  };

  const playClick = () => {
    playTone(800, 'triangle', 0.05, 0.05);
  };

  return { playCorrect, playWrong, playWin, playClick };
}
