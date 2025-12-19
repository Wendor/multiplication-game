<template>
  <div class="page-container">
    <TopBar title="Деление">
      <span v-if="mode === 'blitz'">⚡ {{ blitzHighScore }}</span>
      <span v-else>🏆 {{ progress.totalSolved }}</span>
    </TopBar>

    <GameControls
      v-model:mode="mode"
      :mistakesCount="mistakesCount"
      :showDifficulty="(mode === 'test' || mode === 'learning') && testTarget === 'mix'"
      v-model:currentDifficulty="maxNumber"
      :difficultyOptions="[{ label: 'до 20', value: 20 }, { label: 'до 50', value: 50 }, { label: 'до 100', value: 100 }]"
    />

    <transition name="fade-mode" mode="out-in">
      <div v-if="mode === 'learning'" key="learning" class="learning-wrapper">
        <LearningNav v-model="activeTable" :total="10" :getMedal="progress.getDivisionMedal" />
        <transition name="slide-up-fade" mode="out-in">
          <div :key="activeTable" class="single-table-view">
            <h2 class="table-title">Делим на {{ activeTable }}</h2>
            <div class="rows-container">
              <div v-for="j in 10" :key="j" class="table-row-large" @click="selectFact(j * activeTable, activeTable)">
                <div class="row-content">
                  <span class="num">{{ j * activeTable }}</span><span class="sign">:</span><span class="num">{{ activeTable }}</span><span class="sign">=</span>
                  <span class="result-box revealed">{{ j }}</span>
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
              <div class="big-equation"><span class="color-a">{{ selectedFact.dividend }}</span> : <span class="color-b">{{ selectedFact.divisor }}</span> = {{ selectedFact.dividend / selectedFact.divisor }}</div>
              <div class="viz-container"><MathVisualizer type="division" :a="selectedFact.dividend" :b="selectedFact.divisor" /></div>
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

        <div v-if="mode === 'mistakes' && !testFinished" class="mistakes-title">Отработка ошибок 🩹</div>

        <GameTestArea
          :class="{ 'shake': isError }"
          :question="currentQuestionForProps"
          :currentIndex="currentQuestionIndex"
          :total="mode === 'mistakes' ? questions.length : (mode === 'blitz' ? 100 : 10)"
          :score="score"
          :highScore="mode === 'blitz' ? blitzHighScore : highScore"
          :finished="testFinished"
          :isBlitz="mode === 'blitz'"
          :showRestartButton="showRestart"
          @answer="onAnswer"
          @next="onNext"
          @time-up="finishGame"
          @restart="resetTest"
          @show-stats="goToStats"
        >
          <template #visualizer>
            <div class="test-visualizer-container" v-if="currentQuestion && mode !== 'blitz'">
               <div class="test-visualizer">
                  <MathVisualizer :key="currentQuestion?.text" type="division" :a="currentQuestion.dividend" :b="currentQuestion.divisor" :isMini="true" />
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
import TopBar from '../components/TopBar.vue';
import GameControls from '../components/GameControls.vue';
import LearningNav from '../components/LearningNav.vue';
import GameTestArea from '../components/GameTestArea.vue';
import MathVisualizer from '../components/MathVisualizer.vue';
import { useProgressStore } from '../stores/progress';
import { useNavigationStore } from '../stores/navigation';
import { useAudio } from '../composables/useAudio';
import { useHaptics } from '../composables/useHaptics';
import confetti from 'canvas-confetti';

const progress = useProgressStore();
const nav = useNavigationStore();
const { playCorrect, playWrong, playWin } = useAudio();
const { vibrateMedium, vibrateError, vibrateWin } = useHaptics();

type Mode = 'learning' | 'test' | 'blitz' | 'mistakes';
type TestTarget = 'mix' | number;

const mode = ref<Mode>('test');
const maxNumber = ref(20);
const testTarget = ref<TestTarget>('mix');
const activeTable = ref(2);
const selectedFact = ref<{dividend: number, divisor: number} | null>(null);
const currentQuestionIndex = ref(0);
const score = ref(0);
const testFinished = ref(false);
const isError = ref(false);

interface DivQuestion { text: string; dividend: number; divisor: number; correctAnswer: number; options: number[]; }
interface WeightedDivFact { dividend: number; divisor: number; weight: number; }

const questions = reactive<DivQuestion[]>([]);
const questionStartTime = ref(0);

const highScore = computed(() => progress.divisionHighScore);
const blitzHighScore = computed(() => progress.blitzHighScore);
const currentQuestion = computed(() => questions[currentQuestionIndex.value]);
const currentQuestionForProps = computed(() => currentQuestion.value);
const mistakesCount = computed(() => progress.getDivisionMistakes().length);
const showRestart = computed(() => mode.value !== 'mistakes' || mistakesCount.value > 0);

watch(maxNumber, () => { if (mode.value === 'test' && testTarget.value === 'mix') resetTest(); });
watch(mode, () => resetTest());

const setTestTarget = (t: TestTarget) => { testTarget.value = t; resetTest(); };
const selectFact = (dividend: number, divisor: number) => { selectedFact.value = { dividend, divisor }; };

// --- ИСПРАВЛЕНО ---
const goToStats = () => {
  nav.navigate('stats', 'division');
};
// ------------------

const generateTest = () => {
  questions.length = 0;
  if (mode.value === 'mistakes') {
      const errors = progress.getDivisionMistakes();
      errors.sort(() => Math.random() - 0.5);
      const selected = errors.slice(0, 10);
      selected.forEach(e => questions.push(createQuestionObject(e.dividend, e.divisor)));
      questionStartTime.value = Date.now();
      return;
  }
  const limit = mode.value === 'blitz' ? 100 : 10;
  let candidates: WeightedDivFact[] = [];
  const fillCandidates = () => {
      const pool: WeightedDivFact[] = [];
      if (testTarget.value !== 'mix' && typeof testTarget.value === 'number') {
          const divisor = testTarget.value;
          for (let ans = 1; ans <= 10; ans++) { pool.push(createWeightedFact(ans * divisor, divisor)); }
      } else {
          for (let divisor = 2; divisor <= 9; divisor++) {
              const maxAnswer = Math.min(10, Math.floor(maxNumber.value / divisor));
              for (let ans = 1; ans <= maxAnswer; ans++) { pool.push(createWeightedFact(ans * divisor, divisor)); }
          }
      }
      return pool;
  };
  candidates = fillCandidates();
  for(let i=0; i<limit; i++) {
     if (candidates.length === 0) { if (mode.value === 'blitz') candidates = fillCandidates(); else break; }
     const selected = pickWeighted(candidates);
     const idx = candidates.indexOf(selected);
     if (idx > -1) candidates.splice(idx, 1);
     questions.push(createQuestionObject(selected.dividend, selected.divisor));
  }
  questionStartTime.value = Date.now();
};

const createWeightedFact = (dividend: number, divisor: number): WeightedDivFact => {
    const stat = progress.getDivisionStat(dividend, divisor);
    const attempts = stat.c + stat.w;
    let weight = 0;
    if (attempts === 0) { weight = 1000; }
    else { weight = Math.max(1, Math.round(100 / attempts)); }
    if (stat.w > 0) weight += 5;
    return { dividend, divisor, weight };
};
const pickWeighted = (items: WeightedDivFact[]): WeightedDivFact => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) { random -= item.weight; if (random <= 0) return item; }
  return items[items.length - 1]!;
};
const createQuestionObject = (dividend: number, divisor: number): DivQuestion => {
    const ans = dividend / divisor;
    return { dividend, divisor, text: `${dividend} : ${divisor}`, correctAnswer: ans, options: generateOptions(ans) };
};
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateOptions = (correct: number) => { const s = new Set<number>(); s.add(correct); while (s.size < 4) { const dev = getRandomInt(-3, 3); const w = correct + dev; if(w > 0 && w !== correct) s.add(w); } return Array.from(s).sort(() => Math.random() - 0.5); };

const onAnswer = (isCorrect: boolean) => {
  if (!currentQuestion.value) return;
  const timeTaken = Date.now() - questionStartTime.value;
  if (isCorrect) {
    score.value++;
    progress.incrementTotalSolved();
    playCorrect();
    vibrateMedium();
  } else {
    playWrong();
    vibrateError();
    isError.value = true;
    setTimeout(() => isError.value = false, 400);
  }
  progress.saveDivisionStat(currentQuestion.value.dividend, currentQuestion.value.divisor, isCorrect, timeTaken);
};

const onNext = () => { if (currentQuestionIndex.value < questions.length - 1) { currentQuestionIndex.value++; questionStartTime.value = Date.now(); } else { finishGame(); } };

const finishGame = () => {
  testFinished.value = true;
  const isPerfect = (mode.value === 'test' && score.value === 10) || (mode.value === 'blitz' && score.value > 15);
  if (isPerfect) {
    playWin();
    vibrateWin();
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71'] });
  }
  if (mode.value === 'blitz') progress.checkNewRecord('blitz', score.value);
  else { if (score.value > highScore.value) progress.checkNewRecord('division', score.value); if (score.value === 10) progress.registerPerfectTest(); }
};

const resetTest = () => { currentQuestionIndex.value = 0; score.value = 0; testFinished.value = false; generateTest(); };
onMounted(() => generateTest());
</script>

<style scoped></style>
