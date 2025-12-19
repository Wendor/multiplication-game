<template>
  <div class="game-container">
    <div class="top-bar">
      <h1>Умножение</h1>
      <div class="header-stats">
        <span>🏆 {{ highScore }}</span>
      </div>
    </div>

    <div class="controls-area">
      <div class="segmented-control">
        <button
          :class="{ active: mode === 'learning' }"
          @click="setMode('learning')"
        >
          Учить
        </button>
        <button
          :class="{ active: mode === 'test' }"
          @click="setMode('test')"
        >
          Тест
        </button>
      </div>

      <transition name="fade">
        <div class="difficulty-selector" v-if="mode === 'learning' || testTarget === 'mix'">
          <span class="label">Сложность:</span>
          <div class="chips-row">
            <button
              v-for="lvl in difficulties"
              :key="lvl.max"
              class="chip"
              :class="{ active: maxNumber === lvl.max }"
              @click="setDifficulty(lvl.max)"
            >
              {{ lvl.shortLabel }}
            </button>
          </div>
        </div>
      </transition>
    </div>

    <transition name="fade-mode" mode="out-in">

      <div v-if="mode === 'learning'" key="learning" class="learning-wrapper">

        <div class="number-nav">
          <button
            v-for="i in maxNumber"
            :key="i"
            class="nav-circle"
            :class="{ active: activeTable === i }"
            @click="activeTable = i"
          >
            {{ i }}
          </button>
        </div>

        <div class="toggle-row">
          <label class="toggle-switch">
            <input type="checkbox" v-model="hideAnswers" />
            <span class="slider"></span>
          </label>
          <span class="toggle-text">Скрыть ответы</span>
        </div>

        <transition name="slide-up-fade" mode="out-in">
          <div :key="activeTable" class="single-table-view">
            <h2 class="table-title">Таблица на {{ activeTable }}</h2>

            <div class="rows-container">
              <div
                v-for="j in 10"
                :key="j"
                class="table-row-large"
                :class="{ 'row-selected': selectedFact?.a === activeTable && selectedFact?.b === j }"
                @click="selectFact(activeTable, j)"
              >
                <div class="row-content">
                  <span class="num">{{ activeTable }}</span>
                  <span class="sign">×</span>
                  <span class="num">{{ j }}</span>
                  <span class="sign">=</span>

                  <span
                    class="result-box"
                    :class="{
                      'revealed': !hideAnswers || (selectedFact?.a === activeTable && selectedFact?.b === j),
                      'hidden': hideAnswers && !(selectedFact?.a === activeTable && selectedFact?.b === j)
                    }"
                  >
                    {{ activeTable * j }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <div
          class="visualizer-backdrop"
          v-if="selectedFact"
          @click="selectedFact = null"
        ></div>

        <transition name="slide-up-panel">
          <div class="visualizer-panel" v-if="selectedFact">
            <div class="visualizer-card">
              <button class="close-btn-mobile" @click="selectedFact = null">✕</button>

              <h3>Как это работает?</h3>
              <div class="big-equation">
                {{ selectedFact.a }} × {{ selectedFact.b }} = {{ selectedFact.a * selectedFact.b }}
              </div>

              <div class="dots-wrapper">
                <div class="dots-grid" :style="{ gridTemplateColumns: `repeat(${selectedFact.b}, 1fr)` }">
                  <div
                    v-for="n in (selectedFact.a * selectedFact.b)"
                    :key="n"
                    class="dot"
                    :style="{ animationDelay: `${n * 0.02}s` }"
                  ></div>
                </div>
              </div>

              <p class="visualizer-hint">
                {{ selectedFact.a }} {{ getRowWord(selectedFact.a) }} по {{ selectedFact.b }}
              </p>
            </div>
          </div>
        </transition>
      </div>

      <div v-else-if="mode === 'test'" key="test" class="test-area">

        <div class="test-settings" v-if="!testFinished">
          <div class="number-nav compact-nav">
            <button
              class="nav-pill"
              :class="{ active: testTarget === 'mix' }"
              @click="setTestTarget('mix')"
            >
              🔀 Микс
            </button>
            <button
              v-for="i in 10"
              :key="i"
              class="nav-circle small"
              :class="{ active: testTarget === i }"
              @click="setTestTarget(i)"
            >
              {{ i }}
            </button>
          </div>
        </div>

        <transition name="slide-question" mode="out-in">
          <div v-if="!testFinished && currentQuestion" :key="currentQuestionIndex + '-' + currentQuestion.a + '-' + currentQuestion.b">
            <div class="progress-bar-container">
              <div class="progress-fill" :style="{ width: ((currentQuestionIndex) / 10) * 100 + '%' }"></div>
            </div>
            <div class="progress-text">Вопрос {{ currentQuestionIndex + 1 }} / 10</div>

            <div class="question-card">
              <div class="question-text">
                {{ currentQuestion.a }} × {{ currentQuestion.b }} = <span class="q-mark">?</span>
              </div>

              <div class="test-visualizer">
                <div class="dots-grid mini-grid" :style="{ gridTemplateColumns: `repeat(${currentQuestion.b}, 1fr)` }">
                  <div
                    v-for="n in (currentQuestion.a * currentQuestion.b)"
                    :key="n"
                    class="dot mini-dot"
                    :style="{ animationDelay: `${n * 0.015}s` }"
                  ></div>
                </div>
              </div>

              <div class="options-grid">
                <button
                  v-for="option in currentQuestion.options"
                  :key="option"
                  @click="checkAnswer(option)"
                  class="option-button"
                >
                  {{ option }}
                </button>
              </div>
            </div>
          </div>

          <div v-else class="results" key="results">
            <h2>Финиш!</h2>
            <div class="final-score-circle">
              {{ score }} / 10
            </div>
            <p v-if="score > highScore" class="new-record">🏆 Новый рекорд!</p>
            <p v-else-if="score === 10" class="perfect-score">Идеально! ⭐</p>
            <p v-else class="encouragement">Молодец!</p>

            <button @click="resetTest" class="main-action-button">Ещё раз</button>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';

type Mode = 'learning' | 'test';
type TestTarget = 'mix' | number;

interface Question {
  a: number;
  b: number;
  correctAnswer: number;
  options: number[];
}
interface Difficulty {
  shortLabel: string;
  max: number;
}
interface Fact {
  a: number;
  b: number;
}

const difficulties: Difficulty[] = [
  { shortLabel: 'до 5', max: 5 },
  { shortLabel: 'до 8', max: 8 },
  { shortLabel: 'до 10', max: 10 },
];

const mode = ref<Mode>('learning');
const maxNumber = ref(10);
const activeTable = ref(2);
const testTarget = ref<TestTarget>('mix');
const currentQuestionIndex = ref(0);
const score = ref(0);
const highScore = ref(0);
const testFinished = ref(false);
const questions = reactive<Question[]>([]);
const hideAnswers = ref(false);
const selectedFact = ref<Fact | null>(null);

const currentQuestion = computed(() => questions[currentQuestionIndex.value]);

watch(maxNumber, (newMax) => {
  if (activeTable.value > newMax) activeTable.value = newMax;
  if (mode.value === 'test' && testTarget.value === 'mix') resetTest();
});

const setMode = (newMode: Mode) => {
  mode.value = newMode;
  if (newMode === 'test') resetTest();
  else selectedFact.value = null;
};

const setDifficulty = (max: number) => {
  maxNumber.value = max;
};

const setTestTarget = (target: TestTarget) => {
  testTarget.value = target;
  resetTest();
};

const selectFact = (a: number, b: number) => {
  if (selectedFact.value?.a === a && selectedFact.value?.b === b) {
    selectedFact.value = null;
  } else {
    selectedFact.value = { a, b };
  }
};

const getRowWord = (num: number) => {
  if (num === 1) return 'ряд';
  if (num >= 2 && num <= 4) return 'ряда';
  return 'рядов';
};

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateOptions = (correct: number) => {
  const s = new Set<number>();
  s.add(correct);
  while (s.size < 4) {
    const dev = getRandomInt(-5, 5);
    const w = correct + dev;
    if (w > 0 && w !== correct) s.add(w);
  }
  return Array.from(s).sort(() => Math.random() - 0.5);
};

const generateTest = () => {
  questions.length = 0;

  if (testTarget.value === 'mix') {
    const uniquePairs: Fact[] = [];
    const start = 2;

    for (let i = start; i <= maxNumber.value; i++) {
      for (let j = i; j <= maxNumber.value; j++) {
        uniquePairs.push({ a: i, b: j });
      }
    }
    uniquePairs.sort(() => Math.random() - 0.5);
    const selected = uniquePairs.slice(0, 10);

    selected.forEach(p => {
      const swap = Math.random() > 0.5;
      const finalA = swap ? p.b : p.a;
      const finalB = swap ? p.a : p.b;
      const ans = finalA * finalB;
      questions.push({
        a: finalA, b: finalB, correctAnswer: ans, options: generateOptions(ans)
      });
    });

  } else {
    const multiplier = testTarget.value as number;
    const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(() => Math.random() - 0.5);

    factors.forEach(f => {
      const swap = Math.random() > 0.5;
      const finalA = swap ? f : multiplier;
      const finalB = swap ? multiplier : f;
      const ans = finalA * finalB;

      questions.push({
        a: finalA, b: finalB, correctAnswer: ans, options: generateOptions(ans)
      });
    });
  }
};

const checkAnswer = (selected: number) => {
  if (!currentQuestion.value) return;
  if (selected === currentQuestion.value.correctAnswer) score.value++;

  if (currentQuestionIndex.value < 9) currentQuestionIndex.value++;
  else finishGame();
};

const finishGame = () => {
  testFinished.value = true;
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem('multiplicationHighScore', highScore.value.toString());
  }
};

const resetTest = () => {
  currentQuestionIndex.value = 0;
  score.value = 0;
  testFinished.value = false;
  generateTest();
};

onMounted(() => {
  const s = localStorage.getItem('multiplicationHighScore');
  if (s) highScore.value = parseInt(s, 10);
  generateTest();
});
</script>

<style scoped>
/* --- 1. Глобальный сброс и настройки контейнера --- */
* {
  box-sizing: border-box; /* Важно: padding не увеличивает ширину элемента */
}

.game-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  width: 100%;
  max-width: 500px; /* Ограничиваем ширину только на больших экранах */
  margin: 0 auto;
  padding: 10px; /* Минимальный отступ от краев экрана */
  background-color: #f4f6f8;
  min-height: 100vh;
  color: #333;
  overflow-x: hidden;
}

/* --- 2. Шапка (Header) --- */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
h1 {
  font-size: 1.2rem;
  margin: 0;
  color: #2c3e50;
}
.header-stats {
  background: #ffecb3;
  color: #d35400;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  white-space: nowrap;
}

/* --- 3. Панель управления (Controls) --- */
.controls-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

/* Переключатель режимов */
.segmented-control {
  display: flex;
  width: 100%;
  background: #e0e0e0;
  padding: 4px;
  border-radius: 12px;
}
.segmented-control button {
  flex: 1; /* Кнопки делят место поровну */
  border: none;
  background: transparent;
  padding: 8px 0;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #7f8c8d;
  cursor: pointer;
  text-align: center;
}
.segmented-control button.active {
  background: white;
  color: #333;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Кнопки сложности */
.difficulty-selector {
  width: 100%;
}
.difficulty-selector .label { display: none; } /* Скрываем текст, экономим место */

.chips-row {
  display: flex;
  width: 100%;
  gap: 8px;
}
.chip {
  flex: 1; /* Растягиваем на всю ширину */
  background: white;
  border: 1px solid #ddd;
  padding: 8px 0;
  border-radius: 12px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #555;
  text-align: center;
  white-space: nowrap; /* Текст не переносится */
}
.chip.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

/* --- 4. Навигация (Скролл-лента) --- */
.number-nav {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  /* Отступы внутри, чтобы тень кнопок не обрезалась */
  padding: 10px 5px;
  /* Отрицательные марджины, чтобы лента касалась краев экрана */
  margin: 0 -10px 10px -10px;
  padding-left: 10px; /* Компенсация марджина */
  padding-right: 10px;

  /* Скрываем скроллбар */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.number-nav::-webkit-scrollbar { display: none; }

/* Круглые кнопки навигации */
.nav-circle {
  flex: 0 0 44px; /* Фиксированный размер, не сжимается */
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 2px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: bold;
  color: #555;
  transition: transform 0.2s;
}
.nav-circle.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
}

/* Кнопка-таблетка (Микс) */
.nav-pill {
  flex: 0 0 auto; /* Не сжиматься */
  padding: 0 16px;
  height: 44px;
  border-radius: 22px;
  background: white;
  border: 2px solid #eee;
  font-weight: bold;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-pill.active {
  background: #9b59b6;
  color: white;
  border-color: #8e44ad;
}

/* --- 5. Таблицы (Learning Mode) --- */
.single-table-view {
  background: white;
  border-radius: 16px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.table-title {
  text-align: center;
  margin: 0 0 15px;
  font-size: 1.2rem;
  color: #2c3e50;
}
.table-row-large {
  padding: 12px 0;
  border-bottom: 1px solid #f1f1f1;
}
.row-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem; /* Используем rem для гибкости */
  font-size: 1.3rem;
  font-weight: 500;
}
/* Фиксируем ширину цифр, чтобы знак "=" стоял ровно */
.num { width: 1.5em; text-align: center; font-weight: 700; }
.result-box { width: 2em; text-align: center; font-weight: 800; }
.result-box.revealed { color: #27ae60; }
.result-box.hidden { color: #e0e0e0; }

/* Переключатель "Скрыть ответы" */
.toggle-row {
  display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 15px;
}
.toggle-switch { position: relative; width: 40px; height: 22px; }
.toggle-switch input { display: none; }
.slider {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc; border-radius: 34px; transition: .4s;
}
.slider:before {
  position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px;
  background-color: white; border-radius: 50%; transition: .4s;
}
input:checked + .slider { background-color: #2ecc71; }
input:checked + .slider:before { transform: translateX(18px); }

/* --- 6. Тест (Карточка вопроса) --- */
.test-settings { margin-bottom: 10px; }

.question-card {
  width: 100%;
  background: white;
  border-radius: 20px;
  padding: 20px 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.question-text {
  /* clamp(мин, предпочтительно, макс) - резиновый шрифт! */
  font-size: clamp(2.5rem, 10vw, 3.5rem);
  font-weight: 800;
  margin-bottom: 20px;
  white-space: nowrap; /* Чтобы пример не переносился */
}
.q-mark { color: #3498db; }

/* Сетка вариантов ответа */
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Ровно 2 колонки */
  width: 100%; /* Занимаем всю ширину карточки */
  gap: 12px; /* Расстояние между кнопками */
}

.option-button {
  width: 100%;
  min-height: 65px; /* Минимальная высота, может растягиваться */
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 14px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  /* Flex для центрирования текста */
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation; /* Улучшает реакцию на тач */
}
.option-button:active { background: #f0f0f0; transform: scale(0.98); }

/* --- 7. Визуализатор (Адаптивный) --- */
.visualizer-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 99;
}
.visualizer-panel { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; }
.visualizer-card {
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  text-align: center;
  padding-bottom: 40px;
}
.close-btn-mobile {
  position: absolute; top: 10px; right: 10px;
  background: #f1f2f6; border: none; width: 30px; height: 30px;
  border-radius: 50%; font-weight: bold; color: #7f8c8d;
}
.dots-wrapper {
  max-height: 35vh; overflow-y: auto;
  display: flex; justify-content: center; margin: 15px 0;
}
.dots-grid { display: grid; gap: 6px; }
.dot {
  width: 14px; height: 14px; background: #e74c3c; border-radius: 50%;
  animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
}

/* Визуализатор в тесте */
.test-visualizer {
  display: flex; justify-content: center; margin-bottom: 20px;
  padding: 8px; background: #fafafa; border-radius: 10px; width: 100%;
}
.mini-grid { gap: 4px; }
.mini-dot { width: 8px; height: 8px; background: #95a5a6; }

/* --- 8. Результаты --- */
.final-score-circle {
  width: 110px; height: 110px;
  background: #2ecc71; color: white;
  font-size: 2.2rem; font-weight: 800; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; margin: 20px auto;
  animation: pop 0.5s;
}
.main-action-button {
  width: 100%; padding: 16px; background: #3498db; color: white; border: none;
  border-radius: 14px; font-size: 1.1rem; font-weight: bold; margin-top: 15px;
}
.results { text-align: center; padding: 10px; }

/* Анимации */
.fade-mode-enter-active, .fade-mode-leave-active { transition: opacity 0.3s ease; }
.fade-mode-enter-from, .fade-mode-leave-to { opacity: 0; }
.slide-question-enter-active, .slide-question-leave-active { transition: all 0.3s ease; }
.slide-question-enter-from { opacity: 0; transform: translateX(20px); }
.slide-question-leave-to { opacity: 0; transform: translateX(-20px); }
.slide-up-panel-enter-active, .slide-up-panel-leave-active { transition: transform 0.3s ease; }
.slide-up-panel-enter-from, .slide-up-panel-leave-to { transform: translateY(100%); }
.slide-up-fade-enter-active, .slide-up-fade-leave-active { transition: opacity 0.3s; }
.slide-up-fade-enter-from, .slide-up-fade-leave-to { opacity: 0; }

@keyframes pop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* --- ЭКСТРЕМАЛЬНО МАЛЕНЬКИЕ ЭКРАНЫ (iPhone SE, Galaxy Fold) --- */
@media (max-width: 360px) {
  .game-container { padding: 5px; }
  h1 { font-size: 1rem; }
  .header-stats { font-size: 0.8rem; }

  .nav-circle { flex: 0 0 38px; height: 38px; font-size: 0.9rem; }
  .nav-pill { height: 38px; padding: 0 10px; font-size: 0.8rem; }

  .chip { padding: 6px 0; font-size: 0.75rem; }

  /* Уменьшаем шрифт вопроса еще сильнее */
  .question-text { font-size: 2.2rem; }

  .option-button { min-height: 55px; font-size: 1.2rem; }
}
</style>
