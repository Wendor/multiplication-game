export function useHaptics() {

  // Проверка поддержки (чтобы не было ошибок на ПК или iOS)
  const isSupported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  // 1. Легкий удар (для кнопок или правильного ответа)
  const vibrateLight = () => {
    if (isSupported) navigator.vibrate(15);
  };

  // 2. Средний удар (для обычных событий)
  const vibrateMedium = () => {
    if (isSupported) navigator.vibrate(40);
  };

  // 3. Ошибка (Двойной тяжелый толчок)
  const vibrateError = () => {
    if (isSupported) navigator.vibrate([50, 50, 50]);
  };

  // 4. Победа (Ритмичная вибрация)
  const vibrateWin = () => {
    if (isSupported) {
      // Тррр - Тррр - Трррррр
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  };

  return { vibrateLight, vibrateMedium, vibrateError, vibrateWin };
}
