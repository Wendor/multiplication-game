import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export interface StatData {
  [key: string]: { c: number; w: number };
}

export const useProgressStore = defineStore('progress', () => {
  // --- Состояние ---
  const multiplicationHighScore = ref(0);
  const sumSubHighScore = ref(0);
  const divisionHighScore = ref(0);
  const blitzHighScore = ref(0);

  const totalSolved = ref(0);

  const multiplicationStats = ref<StatData>({});

  // --- Инициализация ---
  const init = () => {
    const multHS = localStorage.getItem('multiplicationHighScore');
    if (multHS) multiplicationHighScore.value = parseInt(multHS, 10);

    const blzHS = localStorage.getItem('blitzHighScore');
    if (blzHS) blitzHighScore.value = parseInt(blzHS, 10);

    const sumHS = localStorage.getItem('sumSubHighScore');
    if (sumHS) sumSubHighScore.value = parseInt(sumHS, 10);

    const divHS = localStorage.getItem('divisionHighScore');
    if (divHS) divisionHighScore.value = parseInt(divHS, 10);

    // Загружаем общий счетчик
    const total = localStorage.getItem('totalSolved');
    if (total) totalSolved.value = parseInt(total, 10);

    const stats = localStorage.getItem('multiplicationStats');
    if (stats) multiplicationStats.value = JSON.parse(stats);
  };

  init();

  // --- Watchers ---
  watch(multiplicationHighScore, (val) => localStorage.setItem('multiplicationHighScore', val.toString()));
  watch(sumSubHighScore, (val) => localStorage.setItem('sumSubHighScore', val.toString()));
  watch(divisionHighScore, (val) => localStorage.setItem('divisionHighScore', val.toString()));
  watch(blitzHighScore, (val) => localStorage.setItem('blitzHighScore', val.toString()));

  // Сохраняем общий счетчик
  watch(totalSolved, (val) => localStorage.setItem('totalSolved', val.toString()));

  watch(multiplicationStats, (val) => localStorage.setItem('multiplicationStats', JSON.stringify(val)), { deep: true });

  // --- Actions ---
  const incrementTotalSolved = () => {
    totalSolved.value++;
  };

  const getStat = (a: number, b: number) => {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return multiplicationStats.value[`${min}x${max}`] || { c: 0, w: 0 };
  };

  const saveStat = (a: number, b: number, isCorrect: boolean) => {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const key = `${min}x${max}`;

    if (!multiplicationStats.value[key]) {
      multiplicationStats.value[key] = { c: 0, w: 0 };
    }

    if (isCorrect) multiplicationStats.value[key].c++;
    else multiplicationStats.value[key].w++;
  };

  const checkNewRecord = (game: string, score: number) => {
    if (game === 'multiplication' && score > multiplicationHighScore.value) multiplicationHighScore.value = score;
    if (game === 'sumsub' && score > sumSubHighScore.value) sumSubHighScore.value = score;
    if (game === 'division' && score > divisionHighScore.value) divisionHighScore.value = score;
    if (game === 'blitz' && score > blitzHighScore.value) blitzHighScore.value = score;
  };

  const getMistakes = () => {
    const mistakes: { a: number, b: number }[] = [];
    for (const [key, val] of Object.entries(multiplicationStats.value)) {
      if (val.w > 0) {
        const [a, b] = key.split('x').map(Number) as [number, number];
        mistakes.push({ a, b });
      }
    }
    return mistakes;
  };

  const getMedalForNumber = (num: number) => {
    let masteredFacts = 0;
    let attemptedFacts = 0;

    for (let i = 1; i <= 10; i++) {
      const min = Math.min(num, i);
      const max = Math.max(num, i);
      const key = `${min}x${max}`;
      const s = multiplicationStats.value[key];

      if (s) {
        if (s.c > 0 || s.w > 0) attemptedFacts++;
        if (s.c >= 5 && s.w === 0) masteredFacts++;
      }
    }

    if (masteredFacts === 10) return 3;
    if (attemptedFacts === 10 && masteredFacts >= 5) return 2;
    if (attemptedFacts === 10) return 1;
    return 0;
  };

  return {
    multiplicationHighScore,
    sumSubHighScore,
    divisionHighScore,
    blitzHighScore,
    totalSolved,
    incrementTotalSolved,
    saveStat,
    getStat,
    checkNewRecord,
    getMistakes,
    getMedalForNumber
  };
});
