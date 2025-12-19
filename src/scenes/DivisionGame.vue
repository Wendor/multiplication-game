<template>
  <div class="game-container">
    <div class="top-bar">
      <button class="back-btn" @click="nav.goBack()">←</button>
      <h1>Деление</h1>
      <div class="header-stats" v-if="mode === 'blitz'">⚡ {{ blitzHighScore }}</div>
      <div class="header-stats" v-else>🏆 {{ progress.totalSolved }}</div>
    </div>

    <div class="controls-area">
      <div class="segmented-control">
        <button :class="{ active: mode === 'learning' }" @click="setMode('learning')">Учить</button>
        <button :class="{ active: mode === 'test' }" @click="setMode('test')">Тест</button>
        <button :class="{ active: mode === 'blitz' }" @click="setMode('blitz')">⚡ Блиц</button>
      </div>

      <transition name="fade">
        <button v-if="hasMistakes && mode !== 'mistakes' && mode !== 'learning'" class="mistakes-btn" @click="setMode('mistakes')">
          🩹 Исправить ошибки ({{ mistakesCount }})
        </button>
      </transition>

      <transition name="fade">
        <div class="difficulty-selector" v-if="(mode === 'test' || mode === 'learning') && testTarget === 'mix'">
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
            <div class="medal-icon" v-if="progress.getDivisionMedal(i) === 3">🥇</div>
            <div class="medal-icon" v-else-if="progress.getDivisionMedal(i) === 2">🥈</div>
            <div class="medal-icon" v-else-if="progress.getDivisionMedal(i) === 1">🥉</div>
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
                   <div v-for="g in (selectedFact.dividend / selectedFact.divisor)" :key="g" class="dot-group">
                      <div v-for="d in selectedFact.divisor" :key="d" class="dot"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div v-else key="test" class="test-wrapper">

        <div class="test-settings" v-if="!testFinished && mode === 'test'">
          <div class="number-nav compact-nav">
            <button class="nav-pill" :class="{ active: testTarget === 'mix' }" @click="setTestTarget('mix')">🔀 Микс</button>
            <button v-for="i in 10" :key="i" class="nav-circle small" :class="{ active: testTarget === i }" @click="setTestTarget(i)">
              {{ i }}
              <div class="medal-icon small-medal" v-if="progress.getDivisionMedal(i) === 3">🥇</div>
              <div class="medal-icon small-medal" v-else-if="progress.getDivisionMedal(i) === 2">🥈</div>
              <div class="medal-icon small-medal" v-else-if="progress.getDivisionMedal(i) === 1">🥉</div>
            </button>
          </div>
        </div>

        <div v-if="mode === 'mistakes' && !testFinished" class="mistakes-title">
          Отработка ошибок 🩹
        </div>

        <GameTestArea
          :question="currentQuestionForProps"
          :currentIndex="currentQuestionIndex"
          :total="mode === 'mistakes' ? questions.length : (mode === 'blitz' ? 100 : 10)"
          :score="score"
          :highScore="mode === 'blitz' ? blitzHighScore : highScore"
          :finished="testFinished"
          :isBlitz="mode === 'blitz'"
          @answer="onAnswer"
          @next="onNext"
          @time-up="finishGame"
          @restart="resetTest"
        >
          <template #visualizer>
            <div class="test-visualizer-container" v-if="currentQuestion && mode !== 'blitz'">
               <div class="test-visualizer">
                  <div class="division-visualizer mini-viz">
                     <div v-for="g in (currentQuestion.dividend / currentQuestion.divisor)" :key="'g'+g" class="dot-group mini-group">
                        <div v-for="d in currentQuestion.divisor" :key="'d'+d" class="dot mini-dot"></div>
                     </div>
                  </div>
               </div>
            </div>
          </template>
        </GameTestArea>
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

// Добавили 'mistakes' в тип
type Mode = 'learning' | 'test' | 'blitz' | 'mistakes';
type TestTarget = 'mix' | number;

const mode = ref<Mode>('test');
const maxNumber = ref(20);
const testTarget = ref<TestTarget>('mix');

// Обучение
const activeTable = ref(2);
const hideAnswers = ref(false);
const selectedFact = ref<{dividend: number, divisor: number} | null>(null);

// Тест
const currentQuestionIndex = ref(0);
const score = ref(0);
const testFinished = ref(false);

interface DivQuestion {
  dividend: number;
  divisor: number;
  text: string;
  correctAnswer: number;
  options: number[];
}
interface WeightedDivFact {
  dividend: number;
  divisor: number;
  weight: number;
}

const questions = reactive<DivQuestion[]>([]);
const questionStartTime = ref(0);

const highScore = computed(() => progress.divisionHighScore);
const blitzHighScore = computed(() => progress.blitzHighScore);
const currentQuestion = computed(() => questions[currentQuestionIndex.value]);
const currentQuestionForProps = computed(() => currentQuestion.value);
const mistakesCount = computed(() => progress.getDivisionMistakes().length);
const hasMistakes = computed(() => mistakesCount.value > 0);

watch(maxNumber, () => {
  if (mode.value === 'test' && testTarget.value === 'mix') resetTest();
});

const setMode = (m: Mode) => {
  mode.value = m;
  if (m !== 'learning') resetTest();
  else selectedFact.value = null;
};

const setTestTarget = (t: TestTarget) => {
  testTarget.value = t;
  resetTest();
};

const selectFact = (dividend: number, divisor: number) => {
  selectedFact.value = { dividend, divisor };
};

const generateTest = () => {
  questions.length = 0;

  if (mode.value === 'mistakes') {
      const errors = progress.getDivisionMistakes();
      errors.sort(() => Math.random() - 0.5);
      const selected = errors.slice(0, 10);
      selected.forEach(e => {
          questions.push(createQuestionObject(e.dividend, e.divisor));
      });
      questionStartTime.value = Date.now();
      return;
  }

  const limit = mode.value === 'blitz' ? 100 : 10;
  let candidates: WeightedDivFact[] = [];

  const fillCandidates = () => {
      const pool: WeightedDivFact[] = [];
      if (testTarget.value !== 'mix' && typeof testTarget.value === 'number') {
          const divisor = testTarget.value;
          for (let ans = 1; ans <= 10; ans++) {
              pool.push(createWeightedFact(ans * divisor, divisor));
          }
      } else {
          for (let divisor = 2; divisor <= 9; divisor++) {
              const maxAnswer = Math.min(10, Math.floor(maxNumber.value / divisor));
              for (let ans = 1; ans <= maxAnswer; ans++) {
                  pool.push(createWeightedFact(ans * divisor, divisor));
              }
          }
      }
      return pool;
  };

  candidates = fillCandidates();

  for(let i=0; i<limit; i++) {
     if (candidates.length === 0) {
        if (mode.value === 'blitz') candidates = fillCandidates();
        else break;
     }

     const selected = pickWeighted(candidates);
     const idx = candidates.indexOf(selected);
     if (idx > -1) candidates.splice(idx, 1);

     questions.push(createQuestionObject(selected.dividend, selected.divisor));
  }

  questionStartTime.value = Date.now();
};

const createWeightedFact = (dividend: number, divisor: number): WeightedDivFact => {
    const stat = progress.getDivisionStat(dividend, divisor);
    let weight = 10;
    if (stat.w > 0) weight += (stat.w * 50);
    if (stat.c >= 5 && stat.w === 0) weight = 1;
    else if (stat.c > 2) weight = 5;
    return { dividend, divisor, weight };
};

const pickWeighted = (items: WeightedDivFact[]): WeightedDivFact => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1]!;
};

const createQuestionObject = (dividend: number, divisor: number): DivQuestion => {
    const ans = dividend / divisor;
    return {
        dividend,
        divisor,
        text: `${dividend} : ${divisor}`,
        correctAnswer: ans,
        options: generateOptions(ans)
    };
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

const onAnswer = (isCorrect: boolean) => {
  // ИСПРАВЛЕНИЕ: Проверяем, существует ли вопрос
  if (!currentQuestion.value) return;

  const timeTaken = Date.now() - questionStartTime.value;
  if (isCorrect) {
    score.value++;
    progress.incrementTotalSolved();
  }
  progress.saveDivisionStat(currentQuestion.value.dividend, currentQuestion.value.divisor, isCorrect, timeTaken);
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
* { box-sizing: border-box; }
.game-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; width: 100%; max-width: 500px; margin: 0 auto; padding: 10px; background-color: #f4f6f8; min-height: 100vh; color: #333; }

.top-bar { position: sticky; top: 0; z-index: 100; background-color: rgba(244, 246, 248, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(0,0,0,0.05); margin: -10px -10px 15px -10px; padding: 10px 15px; width: auto; display: flex; align-items: center; gap: 10px; }
.back-btn { background: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; color: #2c3e50; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); flex-shrink: 0; }
h1 { font-size: 1.2rem; margin: 0; color: #2c3e50; flex-grow: 1; }
.header-stats { background: #ffecb3; color: #d35400; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; white-space: nowrap; flex-shrink: 0; }

.controls-area { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.segmented-control { display: flex; width: 100%; background: #e0e0e0; padding: 4px; border-radius: 12px; }
.segmented-control button { flex: 1; border: none; background: transparent; padding: 8px 0; border-radius: 8px; font-weight: 600; font-size: 0.9rem; color: #7f8c8d; cursor: pointer; }
.segmented-control button.active { background: white; color: #333; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.difficulty-selector { width: 100%; }
.chips-row { display: flex; width: 100%; gap: 8px; flex-wrap: wrap; }
.chip { flex: 1 0 20%; background: white; border: 1px solid #ddd; padding: 10px 0; border-radius: 12px; font-size: 0.9rem; cursor: pointer; color: #555; text-align: center; white-space: nowrap; transition: all 0.2s; }
.chip.active { background: #e67e22; color: white; border-color: #d35400; }
.mistakes-btn { background: #e74c3c; color: white; border: none; border-radius: 12px; padding: 10px; font-weight: bold; cursor: pointer; animation: pulse 2s infinite; }
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }

/* Навигация с медалями */
.number-nav { display: flex; overflow-x: auto; gap: 8px; padding: 10px 5px; margin: 0 -10px 10px -10px; padding-left: 10px; padding-right: 10px; scrollbar-width: none; -ms-overflow-style: none; }
.nav-circle { position: relative; flex: 0 0 44px; height: 44px; border-radius: 50%; background: white; border: 2px solid #eee; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: bold; color: #555; transition: transform 0.2s; }
.nav-circle.active { background: #9b59b6; color: white; border-color: #8e44ad; transform: scale(1.1); box-shadow: 0 4px 10px rgba(155, 89, 182, 0.3); }
.medal-icon { position: absolute; top: -8px; right: -8px; font-size: 14px; background: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); pointer-events: none; }
.small-medal { width: 16px; height: 16px; font-size: 10px; top: -5px; right: -5px; }

/* Styles for Learning/Test/Nav */
.nav-pill { flex: 0 0 auto; padding: 0 16px; height: 44px; border-radius: 22px; background: white; border: 2px solid #eee; font-weight: bold; color: #555; display: flex; align-items: center; justify-content: center; }
.nav-pill.active { background: #9b59b6; color: white; border-color: #8e44ad; }

.learning-wrapper { width: 100%; padding-bottom: 40px; }
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

/* Viz Panel */
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

/* Test Visualizer */
.test-visualizer-container { width: 100%; margin-bottom: 15px; display: flex; justify-content: center; }
.test-visualizer { background: #fafafa; padding: 10px; border-radius: 12px; width: 100%; display: flex; justify-content: center; }
.mini-viz { gap: 6px; max-width: 100%; }
.mini-group { padding: 2px; border-width: 1px; border-radius: 4px; }
.mini-dot { width: 10px; height: 10px; }

/* Transitions */
.slide-up-panel-enter-active, .slide-up-panel-leave-active { transition: transform 0.3s ease; }
.slide-up-panel-enter-from, .slide-up-panel-leave-to { transform: translateY(100%); }
.slide-up-fade-enter-active, .slide-up-fade-leave-active { transition: opacity 0.3s; }
.slide-up-fade-enter-from, .slide-up-fade-leave-to { opacity: 0; }
.fade-mode-enter-active, .fade-mode-leave-active { transition: opacity 0.3s ease; }
.fade-mode-enter-from, .fade-mode-leave-to { opacity: 0; }
@keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
