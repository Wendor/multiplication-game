import { useProgressStore } from '../stores/progress';

export function useAudio() {
  const progress = useProgressStore();

  const playTone = (freq: number, type: 'sine' | 'square' | 'triangle', duration: number) => {
    if (progress.isMuted) return;

    // Check for window existence to be safe (SSR friendly)
    if (typeof window === 'undefined') return;

    // Use explicit any to bypass the strict type check on webkitAudioContext for older browsers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playCorrect = () => {
    playTone(600, 'sine', 0.1);
    setTimeout(() => playTone(800, 'sine', 0.2), 100);
  };

  const playWrong = () => {
    playTone(200, 'square', 0.15);
    setTimeout(() => playTone(150, 'square', 0.3), 100);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
  };

  const playWin = () => {
    [523, 659, 784, 1046].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 'triangle', 0.3), i * 150);
    });
  };

  const playClick = () => {
    playTone(800, 'triangle', 0.05);
  };

  return { playCorrect, playWrong, playWin, playClick };
}
