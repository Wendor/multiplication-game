import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';

// --- ИНТЕРФЕЙСЫ ---
export interface StatData {
  [key: string]: { c: number; w: number };
}

export interface AchievementState {
  totalSolved: number;
  currentStreak: number;
  blitzHighScore: number;
  currentLevel: number;
  multiplicationHighScore: number;
  sumSubHighScore: number;
  divisionHighScore: number;
  dailyStreak: number;
  perfectTestCount: number;
  lastVisitHour: number;
  mistakesCorrected: number;
  goldMedalsCount: number;
  lastAnswerTime: number;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  condition: (state: AchievementState) => boolean;
}

export const useProgressStore = defineStore('progress', () => {
  // --- STATE (СОСТОЯНИЕ) ---
  const multiplicationHighScore = ref(0);
  const sumSubHighScore = ref(0);
  const divisionHighScore = ref(0);
  const blitzHighScore = ref(0);

  const totalSolved = ref(0);
  const currentStreak = ref(0);

  const unlockedAchievements = ref<string[]>([]);
  const isMuted = ref(false);

  // Статистика
  const multiplicationStats = ref<StatData>({});
  const divisionStats = ref<StatData>({});
  const sumSubStats = ref<StatData>({});

  const perfectTestCount = ref(0);
  const dailyStreak = ref(0);
  const lastVisitDate = ref('');
  const mistakesCorrected = ref(0);

  const toastVisible = ref(false);
  const currentToastAchievement = ref<Achievement | null>(null);

  // --- АЧИВКИ ---
  const allAchievements: Achievement[] = [
    { id: 'first_steps', emoji: '👟', title: 'Первые шаги', description: 'Реши 10 примеров', condition: (s) => s.totalSolved >= 10 },
    { id: 'warmup', emoji: '🕯️', title: 'Разминка', description: '5 правильных ответов подряд', condition: (s) => s.currentStreak >= 5 },
    { id: 'sniper', emoji: '🎯', title: 'Снайпер', description: '20 правильных ответов подряд', condition: (s) => s.currentStreak >= 20 },
    { id: 'unstopable', emoji: '🔥', title: 'Неудержимый', description: '50 правильных ответов подряд', condition: (s) => s.currentStreak >= 50 },
    { id: 'blitz_rookie', emoji: '⚡', title: 'Вспышка', description: 'Набери 10 очков в Блице', condition: (s) => s.blitzHighScore >= 10 },
    { id: 'blitz_master', emoji: '🌪️', title: 'Ураган', description: 'Набери 30 очков в Блице', condition: (s) => s.blitzHighScore >= 30 },
    { id: 'math_calculator', emoji: '🧮', title: 'Калькулятор', description: 'Рекорд 10 в Сложении', condition: (s) => s.sumSubHighScore >= 10 },
    { id: 'divider_king', emoji: '🗡️', title: 'Делитель', description: 'Рекорд 10 в Делении', condition: (s) => s.divisionHighScore >= 10 },
    { id: 'math_fan', emoji: '🤓', title: 'Любитель', description: 'Реши 100 примеров', condition: (s) => s.totalSolved >= 100 },
    { id: 'hard_worker', emoji: '🚜', title: 'Трудяга', description: 'Реши 500 примеров', condition: (s) => s.totalSolved >= 500 },
    { id: 'legend', emoji: '👑', title: 'Легенда', description: 'Реши 1000 примеров', condition: (s) => s.totalSolved >= 1000 },
    { id: 'student', emoji: '🎒', title: 'Ученик', description: 'Достигни 5 уровня', condition: (s) => s.currentLevel >= 5 },
    { id: 'professor', emoji: '🧠', title: 'Профессор', description: 'Достигни 20 уровня', condition: (s) => s.currentLevel >= 20 },
    { id: 'perfectionist', emoji: '💎', title: 'Перфекционист', description: 'Сдай 5 тестов идеально (10/10)', condition: (s) => s.perfectTestCount >= 5 },
    { id: 'marathon', emoji: '🗓️', title: 'Марафонец', description: 'Занимайся 3 дня подряд', condition: (s) => s.dailyStreak >= 3 },
    { id: 'iron_will', emoji: '🦾', title: 'Железная воля', description: 'Занимайся 7 дней подряд', condition: (s) => s.dailyStreak >= 7 },
    { id: 'versatile', emoji: '🤹', title: 'Универсал', description: 'Сыграй в Умножение, Деление и Сложение', condition: (s) => s.multiplicationHighScore > 0 && s.sumSubHighScore > 0 && s.divisionHighScore > 0 },
    { id: 'night_owl', emoji: '🦉', title: 'Ночной дозор', description: 'Реши пример после 21:00', condition: (s) => s.lastVisitHour >= 21 },
    { id: 'early_bird', emoji: '🐤', title: 'Жаворонок', description: 'Реши пример до 8:00 утра', condition: (s) => s.lastVisitHour < 8 && s.totalSolved > 0 },
    { id: 'speed_racer', emoji: '🏎️', title: 'Гонщик', description: 'Ответь быстрее чем за 1.5 сек', condition: (s) => s.lastAnswerTime > 0 && s.lastAnswerTime <= 1500 },
    { id: 'cleaner', emoji: '🧹', title: 'Чистильщик', description: 'Исправь 10 старых ошибок', condition: (s) => s.mistakesCorrected >= 10 },
    { id: 'medal_collector', emoji: '🎖️', title: 'Коллекционер', description: 'Собери 3 золотые медали', condition: (s) => s.goldMedalsCount >= 3 },
    { id: 'math_champion', emoji: '🏆', title: 'Чемпион', description: 'Собери все 10 золотых медалей', condition: (s) => s.goldMedalsCount >= 10 }
  ];

  const stages = [
    { lvl: 0, emoji: '🥚', title: 'Яйцо' },
    { lvl: 2, emoji: '🐣', title: 'Цыплёнок' },
    { lvl: 5, emoji: '🦊', title: 'Лисенок' },
    { lvl: 10, emoji: '🦉', title: 'Мудрая Сова' },
    { lvl: 15, emoji: '🎓', title: 'Профессор' },
    { lvl: 20, emoji: '🦅', title: 'Орел' },
    { lvl: 30, emoji: '🧙‍♂️', title: 'Магистр' },
    { lvl: 40, emoji: '🧞‍♂️', title: 'Джинн' },
    { lvl: 50, emoji: '🐲', title: 'Дракон' },
    { lvl: 75, emoji: '👑', title: 'Король Математики' },
    { lvl: 100, emoji: '🚀', title: 'Космический Разум' }
  ];

  const checkDailyProgress = () => {
    // ИСПРАВЛЕНИЕ: Добавляем 'as string', так как уверены, что дата есть
    const today = new Date().toISOString().split('T')[0] as string;

    if (lastVisitDate.value !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0] as string; // Здесь тоже полезно добавить

      if (lastVisitDate.value === yesterdayStr) {
        dailyStreak.value++;
      } else {
        dailyStreak.value = 1;
      }
      lastVisitDate.value = today;
    }
  };

  // --- INIT ---
  const init = () => {
    const multHS = localStorage.getItem('multiplicationHighScore');
    if (multHS) multiplicationHighScore.value = parseInt(multHS, 10);
    const blzHS = localStorage.getItem('blitzHighScore');
    if (blzHS) blitzHighScore.value = parseInt(blzHS, 10);
    const sumHS = localStorage.getItem('sumSubHighScore');
    if (sumHS) sumSubHighScore.value = parseInt(sumHS, 10);
    const divHS = localStorage.getItem('divisionHighScore');
    if (divHS) divisionHighScore.value = parseInt(divHS, 10);
    const total = localStorage.getItem('totalSolved');
    if (total) totalSolved.value = parseInt(total, 10);

    const stats = localStorage.getItem('multiplicationStats');
    if (stats) multiplicationStats.value = JSON.parse(stats);

    const divStats = localStorage.getItem('divisionStats');
    if (divStats) divisionStats.value = JSON.parse(divStats);

    const ssStats = localStorage.getItem('sumSubStats');
    if (ssStats) sumSubStats.value = JSON.parse(ssStats);

    const unlocked = localStorage.getItem('unlockedAchievements');
    if (unlocked) unlockedAchievements.value = JSON.parse(unlocked);

    const muted = localStorage.getItem('isMuted');
    if (muted) isMuted.value = JSON.parse(muted);

    const perfects = localStorage.getItem('perfectTestCount');
    if (perfects) perfectTestCount.value = parseInt(perfects, 10);

    const streak = localStorage.getItem('dailyStreak');
    if (streak) dailyStreak.value = parseInt(streak, 10);

    const lastDate = localStorage.getItem('lastVisitDate');
    if (lastDate) lastVisitDate.value = lastDate;

    const corrected = localStorage.getItem('mistakesCorrected');
    if (corrected) mistakesCorrected.value = parseInt(corrected, 10);

    checkDailyProgress();
  };

  // --- WATCHERS ---
  watch(multiplicationHighScore, (val) => localStorage.setItem('multiplicationHighScore', val.toString()));
  watch(sumSubHighScore, (val) => localStorage.setItem('sumSubHighScore', val.toString()));
  watch(divisionHighScore, (val) => localStorage.setItem('divisionHighScore', val.toString()));
  watch(blitzHighScore, (val) => localStorage.setItem('blitzHighScore', val.toString()));
  watch(totalSolved, (val) => localStorage.setItem('totalSolved', val.toString()));
  watch(perfectTestCount, (val) => localStorage.setItem('perfectTestCount', val.toString()));
  watch(dailyStreak, (val) => localStorage.setItem('dailyStreak', val.toString()));
  // ИСПРАВЛЕНИЕ: добавлено as string
  watch(lastVisitDate, (val) => localStorage.setItem('lastVisitDate', val as string));
  watch(mistakesCorrected, (val) => localStorage.setItem('mistakesCorrected', val.toString()));

  watch(multiplicationStats, (val) => localStorage.setItem('multiplicationStats', JSON.stringify(val)), { deep: true });
  watch(divisionStats, (val) => localStorage.setItem('divisionStats', JSON.stringify(val)), { deep: true });
  watch(sumSubStats, (val) => localStorage.setItem('sumSubStats', JSON.stringify(val)), { deep: true });
  watch(unlockedAchievements, (val) => localStorage.setItem('unlockedAchievements', JSON.stringify(val)), { deep: true });
  watch(isMuted, (val) => localStorage.setItem('isMuted', JSON.stringify(val)));


  // --- GETTERS ---
  const currentLevel = computed(() => Math.floor(Math.sqrt(totalSolved.value / 5)) + 1);
  const levelProgress = computed(() => {
    const currentLvl = currentLevel.value;
    const nextLvl = currentLvl + 1;
    const xpForCurrent = 5 * Math.pow(currentLvl - 1, 2);
    const xpForNext = 5 * Math.pow(nextLvl - 1, 2);
    const needed = xpForNext - xpForCurrent;
    const have = totalSolved.value - xpForCurrent;
    if (needed === 0) return 0;
    return Math.min(100, Math.max(0, (have / needed) * 100));
  });

  const currentCharacter = computed(() => {
    const lvl = currentLevel.value;
    const stage = [...stages].reverse().find(s => lvl >= s.lvl);
    return stage || stages[0];
  });

  // Вспомогательная функция для медалей умножения
  const calcMedal = (num: number) => {
    let masteredFacts = 0; let attemptedFacts = 0;
    for (let i = 1; i <= 10; i++) {
      const min = Math.min(num, i); const max = Math.max(num, i);
      const key = `${min}x${max}`; const s = multiplicationStats.value[key];
      if (s) { if (s.c > 0 || s.w > 0) attemptedFacts++; if (s.c >= 5 && s.w === 0) masteredFacts++; }
    }
    if (masteredFacts === 10) return 3;
    if (attemptedFacts === 10 && masteredFacts >= 5) return 2;
    if (attemptedFacts === 10) return 1;
    return 0;
  };

  const calcDivisionMedal = (divisor: number) => {
    let masteredFacts = 0; let attemptedFacts = 0;
    for (let i = 1; i <= 10; i++) {
      const dividend = i * divisor;
      const key = `${dividend}:${divisor}`;
      const s = divisionStats.value[key];
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

  const triggerToast = (ach: Achievement) => {
    currentToastAchievement.value = ach;
    toastVisible.value = true;
    setTimeout(() => { toastVisible.value = false; }, 3000);
  };

  const checkAchievements = (timeTaken: number = 0) => {
    const now = new Date();
    let goldCount = 0;
    for (let i = 1; i <= 10; i++) {
      if (calcMedal(i) === 3) goldCount++;
    }

    const state: AchievementState = {
      totalSolved: totalSolved.value,
      currentStreak: currentStreak.value,
      blitzHighScore: blitzHighScore.value,
      currentLevel: currentLevel.value,
      multiplicationHighScore: multiplicationHighScore.value,
      sumSubHighScore: sumSubHighScore.value,
      divisionHighScore: divisionHighScore.value,
      dailyStreak: dailyStreak.value,
      perfectTestCount: perfectTestCount.value,
      lastVisitHour: now.getHours(),
      mistakesCorrected: mistakesCorrected.value,
      goldMedalsCount: goldCount,
      lastAnswerTime: timeTaken
    };

    allAchievements.forEach(ach => {
      if (!unlockedAchievements.value.includes(ach.id) && ach.condition(state)) {
        unlockedAchievements.value.push(ach.id);
        triggerToast(ach);
      }
    });
  };

  const registerPerfectTest = () => { perfectTestCount.value++; checkAchievements(); };
  const incrementTotalSolved = () => { totalSolved.value++; checkDailyProgress(); checkAchievements(); };

  const saveStat = (a: number, b: number, isCorrect: boolean, timeTaken: number = 0) => {
    if (isCorrect) currentStreak.value++;
    else currentStreak.value = 0;

    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const key = `${min}x${max}`;

    if (!multiplicationStats.value[key]) multiplicationStats.value[key] = { c: 0, w: 0 };

    if (isCorrect) {
      multiplicationStats.value[key].c++;
      if (multiplicationStats.value[key].w > 0) mistakesCorrected.value++;
      multiplicationStats.value[key].w = 0;
    } else {
      multiplicationStats.value[key].w++;
    }
    checkAchievements(timeTaken);
  };

  const saveDivisionStat = (dividend: number, divisor: number, isCorrect: boolean, timeTaken: number = 0) => {
    if (isCorrect) currentStreak.value++;
    else currentStreak.value = 0;

    const key = `${dividend}:${divisor}`;

    if (!divisionStats.value[key]) divisionStats.value[key] = { c: 0, w: 0 };

    if (isCorrect) {
      divisionStats.value[key].c++;
      if (divisionStats.value[key].w > 0) mistakesCorrected.value++;
      divisionStats.value[key].w = 0;
    } else {
      divisionStats.value[key].w++;
    }
    checkAchievements(timeTaken);
  };

  const saveSumSubStat = (a: number, b: number, op: 'plus' | 'minus', isCorrect: boolean, timeTaken: number = 0) => {
    if (isCorrect) currentStreak.value++;
    else currentStreak.value = 0;

    let v1, v2;
    if (op === 'plus') {
      v1 = a;
      v2 = b;
    } else {
      v1 = b;
      v2 = a - b;
    }

    const min = Math.min(v1, v2);
    const max = Math.max(v1, v2);
    const key = `${min}+${max}`;

    if (!sumSubStats.value[key]) sumSubStats.value[key] = { c: 0, w: 0 };

    if (isCorrect) {
      sumSubStats.value[key].c++;
      if (sumSubStats.value[key].w > 0) mistakesCorrected.value++;
      sumSubStats.value[key].w = 0;
    } else {
      sumSubStats.value[key].w++;
    }
    checkAchievements(timeTaken);
  };

  const getStat = (a: number, b: number) => {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return multiplicationStats.value[`${min}x${max}`] || { c: 0, w: 0 };
  };

  const getDivisionStat = (dividend: number, divisor: number) => {
    return divisionStats.value[`${dividend}:${divisor}`] || { c: 0, w: 0 };
  };

  const getSumSubStat = (a: number, b: number) => {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return sumSubStats.value[`${min}+${max}`] || { c: 0, w: 0 };
  };

  const getDivisionMistakes = () => {
    const mistakes: { dividend: number, divisor: number }[] = [];
    for (const [key, val] of Object.entries(divisionStats.value)) {
      if (val.w > 0) {
        const parts = key.split(':');
        if (parts.length === 2) {
          // ИСПРАВЛЕНИЕ: as string
          const d = parseInt(parts[0] as string, 10);
          const div = parseInt(parts[1] as string, 10);
          mistakes.push({ dividend: d, divisor: div });
        }
      }
    }
    return mistakes;
  };

  const getMistakes = (): { a: number, b: number }[] => {
    const mistakes: { a: number, b: number }[] = [];
    for (const [key, val] of Object.entries(multiplicationStats.value)) {
      if (val.w > 0) {
        const parts = key.split('x');
        if (parts.length === 2) {
          // ИСПРАВЛЕНИЕ: as string
          const a = parseInt(parts[0] as string, 10);
          const b = parseInt(parts[1] as string, 10);
          mistakes.push({ a, b });
        }
      }
    }
    return mistakes;
  };

  const getMedalForNumber = (num: number) => calcMedal(num);
  const getDivisionMedal = (num: number) => calcDivisionMedal(num);

  const checkNewRecord = (game: string, score: number) => {
    if (game === 'multiplication' && score > multiplicationHighScore.value) multiplicationHighScore.value = score;
    if (game === 'sumsub' && score > sumSubHighScore.value) sumSubHighScore.value = score;
    if (game === 'division' && score > divisionHighScore.value) divisionHighScore.value = score;
    if (game === 'blitz' && score > blitzHighScore.value) blitzHighScore.value = score;
    checkAchievements();
  };

  const toggleMute = () => { isMuted.value = !isMuted.value; };

  init();

  return {
    multiplicationHighScore, sumSubHighScore, divisionHighScore, blitzHighScore, totalSolved,
    unlockedAchievements, isMuted, toastVisible, currentToastAchievement,
    perfectTestCount, dailyStreak, mistakesCorrected,

    currentLevel, levelProgress, currentCharacter, allAchievements,

    incrementTotalSolved, saveStat, getStat, checkNewRecord,
    getMistakes, getMedalForNumber, toggleMute,
    registerPerfectTest, checkAchievements,

    saveDivisionStat, getDivisionStat, getDivisionMedal, getDivisionMistakes,
    saveSumSubStat, getSumSubStat
  };
});
