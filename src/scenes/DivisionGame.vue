<template>
  <div class="game-container">
    <div class="top-bar">
      <button class="back-btn" @click="nav.goBack()">←</button>
      <h1>Деление</h1>
      <div class="header-stats" v-if="mode === 'blitz'">⚡ {{ progress.blitzHighScore }}</div>
      <div class="header-stats" v-else>🏆 {{ progress.totalSolved }}</div>
    </div>

    <div class="controls-area">
      <div class="segmented-control">
        <button :class="{ active: mode === 'learning' }" @click="setMode('learning')">Учить</button>
        <button :class="{ active: mode === 'test' }" @click="setMode('test')">Тест</button>
        <button :class="{ active: mode === 'blitz' }" @click="setMode('blitz')">⚡ Блиц</button>
      </div>

      <transition name="fade">
        <div class="difficulty-selector" v-if="mode === 'test'">
          <div class="chips-row">
            <button class="chip" :class="{ active: maxNumber === 20 }" @click="maxNumber = 20">до 20</button>
            <button class="chip" :class="{ active: maxNumber === 50 }" @click="maxNumber = 50">до 50</button>
            <button class="chip" :class="{ active: maxNumber === 100 }" @click="maxNumber = 100">до 100</button>
          </div>
        </div>
      </transition>
    </div>

    <transition name="fade-mode" mode="out-in">

      <div v-if="mode === 'learning'" key="learning" class="learning-wrapper">
        <div class="number-nav">
          <button
            v-for="i in 10"
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
            <h2 class="table-title">Делим на {{ activeTable }}</h2>
            <div class="rows-container">
              <div v-for="j in 10" :key="j" class="table-row-large" @click="selectFact(j * activeTable, activeTable)">
                <div class="row-content">
                  <span class="num">{{ j * activeTable }}</span>
                  <span class="sign">:</span>
                  <span class="num">{{ activeTable }}</span>
                  <span class="sign">=</span>
                  <span class="result-box" :class="{ 'revealed': !hideAnswers || (selectedFact?.dividend === j * activeTable) }">
                    {{ j }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <div class="visualizer-backdrop" v-if="selectedFact" @click="selectedFact = null"></div>
        <transition name="slide-up-panel">
          <div class="visualizer-panel" v-if="selectedFact">
            <div class="visualizer-card">
              <button class="close-btn-mobile" @click="selectedFact = null">✕</button>
              <h3>Разберем пример:</h3>
              <div class="big-equation">
                <span class="color-a">{{ selectedFact.dividend }}</span> : <span class="color-b">{{ selectedFact.divisor }}</span> = {{ selectedFact.dividend / selectedFact.divisor }}
              </div>

              <p class="viz-hint">Сколько раз <b>{{ selectedFact.divisor }}</b> помещается в <b>{{ selectedFact.dividend }}</b>?</p>

              <div class="viz-container">
                <div class="division-visualizer">
                  <div
                      v-for="g in (selectedFact.dividend / selectedFact.divisor)"
                      :key="g"
                      class="dot-group"
                   >
                      <div v-for="d in selectedFact.divisor" :key="d" class="dot"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div v-else key="test" class="test-wrapper">
        <GameTestArea
          :question="currentQuestionForProps"
          :currentIndex="currentQuestionIndex"
          :total="mode === 'blitz' ? 100 : 10"
          :score="score"
          :highScore="mode === 'blitz' ? progress.blitzHighScore : highScore"
          :finished="testFinished"
          :isBlitz="mode === 'blitz'"
          @answer="onAnswer"
          @next="onNext"
          @time-up="finishGame"
          @restart="resetTest"
        />
      </div>

    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import GameTestArea from '../components/GameTestArea.vue';
import { useNavigationStore } from '../stores/navigation';
import { useProgressStore } from '../stores/progress';

const nav = useNavigationStore();
const progress = useProgressStore();

type Mode = 'learning' | 'test' | 'blitz';
const mode = ref<Mode>('test');
const maxNumber = ref(20);

// Состояние обучения
const activeTable = ref(2); // Деление на 2 по умолчанию
const hideAnswers = ref(false);
const selectedFact = ref<{dividend: number, divisor: number} | null>(null);

// Состояние теста
const currentQuestionIndex = ref(0);
const score = ref(0);
const testFinished = ref(false);
const questions = reactive<{text: string, correctAnswer: number, options: number[]}[]>([]);
const questionStartTime = ref(0);

const highScore = computed(() => progress.divisionHighScore);

const currentQuestion = computed(() => questions[currentQuestionIndex.value]);
const currentQuestionForProps = computed(() => currentQuestion.value);

watch(maxNumber, () => {
  if (mode.value === 'test') resetTest();
});

// Переключение режима
const setMode = (m: Mode) => {
  mode.value = m;
  if (m !== 'learning') resetTest();
  else selectedFact.value = null;
};

const selectFact = (dividend: number, divisor: number) => {
  selectedFact.value = { dividend, divisor };
};

// Генерация теста
const generateTest = () => {
  questions.length = 0;
  const count = mode.value === 'blitz' ? 100 : 10;

  for(let i=0; i<count; i++) {
    // Генерируем a * b = c, показываем c / b = a
    const b = getRandomInt(2, 9); // Делитель
    // Результат (ответ)
    const a = getRandomInt(1, Math.floor(maxNumber.value / b));

    const dividend = a * b; // Делимое
    const text = `${dividend} : ${b}`;

    questions.push({ text, correctAnswer: a, options: generateOptions(a) });
  }

  questionStartTime.value = Date.now();
};

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateOptions = (correct: number) => {
  const s = new Set<number>();
  s.add(correct);
  while(s.size < 4) {
    const dev = getRandomInt(-3, 3);
    const w = correct + dev;
    if(w > 0 && w !== correct) s.add(w);
  }
  return Array.from(s).sort(() => Math.random() - 0.5);
};

// Обработка ответа
const onAnswer = (isCorrect: boolean) => {
  const timeTaken = Date.now() - questionStartTime.value;

  if (isCorrect) {
    score.value++;
    progress.incrementTotalSolved();
  }

  progress.checkAchievements(timeTaken);
};

const onNext = () => {
  if (currentQuestionIndex.value < questions.length - 1) {
    currentQuestionIndex.value++;
    questionStartTime.value = Date.now();
  } else {
    finishGame();
  }
};

const finishGame = () => {
  testFinished.value = true;
  if (mode.value === 'blitz') {
    progress.checkNewRecord('blitz', score.value);
  } else {
    if (score.value > highScore.value) {
      progress.checkNewRecord('division', score.value);
    }
    if (score.value === 10) {
      progress.registerPerfectTest();
    }
  }
};

const resetTest = () => {
  currentQuestionIndex.value = 0;
  score.value = 0;
  testFinished.value = false;
  generateTest();
};

onMounted(() => generateTest());
</script>

<style scoped>
/* FIX: Глобальный box-sizing для этого компонента */
* {
  box-sizing: border-box;
}

/* Базовые стили */
.game-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; width: 100%; max-width: 500px; margin: 0 auto; padding: 10px; background-color: #f4f6f8; min-height: 100vh; color: #333; }

/* Sticky Top Bar (Исправленная) */
.top-bar { position: sticky; top: 0; z-index: 100; background-color: rgba(244, 246, 248, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(0,0,0,0.05); margin: -10px -10px 15px -10px; padding: 10px 15px; width: auto; display: flex; align-items: center; gap: 10px; }
.back-btn { background: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; color: #2c3e50; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); flex-shrink: 0; }
h1 { font-size: 1.2rem; margin: 0; color: #2c3e50; flex-grow: 1; }
.header-stats { background: #ffecb3; color: #d35400; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; white-space: nowrap; flex-shrink: 0; }

.controls-area { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.segmented-control { display: flex; width: 100%; background: #e0e0e0; padding: 4px; border-radius: 12px; }
.segmented-control button { flex: 1; border: none; background: transparent; padding: 8px 0; border-radius: 8px; font-weight: 600; font-size: 0.9rem; color: #7f8c8d; cursor: pointer; }
.segmented-control button.active { background: white; color: #333; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

/* Chips (Исправленный перенос) */
.difficulty-selector { width: 100%; }
.chips-row { display: flex; width: 100%; gap: 8px; flex-wrap: wrap; }
.chip { flex: 1 0 20%; background: white; border: 1px solid #ddd; padding: 10px 0; border-radius: 12px; font-size: 0.9rem; cursor: pointer; color: #555; text-align: center; white-space: nowrap; transition: all 0.2s; }
.chip.active { background: #e67e22; color: white; border-color: #d35400; }

/* === STYLES FOR LEARNING MODE === */
.learning-wrapper { width: 100%; padding-bottom: 40px; }
.number-nav { display: flex; overflow-x: auto; gap: 8px; padding: 5px; margin-bottom: 15px; scrollbar-width: none; }
.nav-circle { flex: 0 0 44px; height: 44px; border-radius: 50%; background: white; border: 2px solid #eee; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: bold; color: #555; cursor: pointer; }
.nav-circle.active { background: #9b59b6; color: white; border-color: #8e44ad; transform: scale(1.1); }

.toggle-row { display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 15px; }
.toggle-switch { position: relative; width: 40px; height: 22px; }
.toggle-switch input { display: none; }
.slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; border-radius: 34px; transition: .4s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px; background-color: white; border-radius: 50%; transition: .4s; }
input:checked + .slider { background-color: #2ecc71; }
input:checked + .slider:before { transform: translateX(18px); }

.single-table-view { background: white; border-radius: 16px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.table-title { text-align: center; margin: 0 0 15px; font-size: 1.2rem; color: #2c3e50; }
.table-row-large { padding: 12px 0; border-bottom: 1px solid #f1f1f1; cursor: pointer; }
.row-content { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1.3rem; font-weight: 500; }
.num { width: 1.5em; text-align: center; font-weight: 700; }
.result-box { width: 2em; text-align: center; font-weight: 800; transition: color 0.3s; }
.result-box.revealed { color: #27ae60; }
.result-box:not(.revealed) { color: transparent; text-shadow: 0 0 5px rgba(0,0,0,0.1); }

/* Visualizer Panel */
.visualizer-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 99; }
.visualizer-panel { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; }
.visualizer-card { background: white; border-radius: 20px 20px 0 0; padding: 20px; text-align: center; padding-bottom: 40px; }
.close-btn-mobile { position: absolute; top: 10px; right: 10px; background: #f1f2f6; border: none; width: 30px; height: 30px; border-radius: 50%; font-weight: bold; color: #7f8c8d; }
.big-equation { font-size: 2rem; font-weight: 800; margin-bottom: 20px; color: #2c3e50; }
.color-a { color: #3498db; }
.color-b { color: #e74c3c; }

.viz-hint { color: #7f8c8d; margin-bottom: 15px; font-size: 0.95rem; }
.viz-container { display: flex; justify-content: center; margin-top: 10px; }
.division-visualizer { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; max-width: 300px; }
.dot-group { display: flex; gap: 3px; padding: 4px; border: 1px dashed #ccc; border-radius: 8px; background: #f9f9f9; }
.dot { width: 14px; height: 14px; border-radius: 50%; background: #3498db; animation: pop 0.3s backwards; }

/* Transitions */
.slide-up-panel-enter-active, .slide-up-panel-leave-active { transition: transform 0.3s ease; }
.slide-up-panel-enter-from, .slide-up-panel-leave-to { transform: translateY(100%); }
.slide-up-fade-enter-active, .slide-up-fade-leave-active { transition: opacity 0.3s; }
.slide-up-fade-enter-from, .slide-up-fade-leave-to { opacity: 0; }
.fade-mode-enter-active, .fade-mode-leave-active { transition: opacity 0.3s ease; }
.fade-mode-enter-from, .fade-mode-leave-to { opacity: 0; }
@keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
