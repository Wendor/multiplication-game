import confetti from 'canvas-confetti';

// 1. Создаем правильный контекст, расширяя тип Window
const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
const audioCtx = new AudioContextClass();

// 2. Используем встроенный тип OscillatorType (включает sine, square, triangle, sawtooth)
const playTone = (freq: number, type: OscillatorType, duration: number) => {
  // Браузеры блокируют звук до первого взаимодействия, поэтому "будим" контекст
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  // Плавное затухание (чтобы не щелкало)
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export function useGameEffects() {

  // Правильный ответ (дзинь)
  const playCorrect = () => {
    playTone(600, 'sine', 0.1);
    setTimeout(() => playTone(800, 'sine', 0.2), 100);
  };

  // Ошибка (низкий гудок - теперь sawtooth работает без ошибок)
  const playWrong = () => {
    playTone(150, 'sawtooth', 0.3);
    if (navigator.vibrate) navigator.vibrate(200);
  };

  // Клик
  const playClick = () => {
    playTone(400, 'sine', 0.05);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  // Победа (аккорд)
  const playWin = () => {
    playTone(400, 'triangle', 0.5);
    setTimeout(() => playTone(500, 'triangle', 0.5), 100);
    setTimeout(() => playTone(600, 'triangle', 0.8), 200);
  };

  // Конфетти
  const runConfetti = () => {
    console.log('Запуск салюта! 🎉');

    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3498db', '#e74c3c', '#f1c40f']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3498db', '#e74c3c', '#f1c40f']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  return {
    playCorrect,
    playWrong,
    playClick,
    playWin,
    runConfetti
  };
}
