<template>
  <div class="page-container">
    <TopBar title="Сложение ±">
      <span v-if="mode === 'blitz'">⚡ {{ progress.blitzHighScore }}</span>
      <span v-else>🏆 {{ progress.totalSolved }}</span>
    </TopBar>

    <GameControls
      v-model:mode="mode"
      :mistakesCount="0"
      :showDifficulty="mode === 'test' && testTarget === 'mix'"
      v-model:currentDifficulty="maxNumber"
      :difficultyOptions="[
        { label: 'до 10', value: 10 },
        { label: 'до 20', value: 20 },
        { label: 'до 50', value: 50 },
        { label: 'до 100', value: 100 }
      ]"
    />

    <transition name="fade-mode" mode="out-in">
      <div v-if="mode === 'learning'" key="learning" class="learning-wrapper">
        <LearningNav v-model="activeTable" :total="10" :getMedal="progress.getSumSubMedal" />
        <transition name="slide-up-fade" mode="out-in">
          <div :key="activeTable" class="single-table-view">
            <h2 class="table-title">Прибавляем к {{ activeTable }}</h2>
            <div class="rows-container">
              <div v-for="j in 10" :key="j" class="table-row-large" @click="selectFact(activeTable, j, 'plus')">
                <div class="row-content">
                  <span class="num">{{ activeTable }}</span><span class="sign">+</span><span class="num">{{ j }}</span><span class="sign">=</span>
                  <span class="result-box revealed">{{ activeTable + j }}</span>
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
              <h3>Сложение:</h3>
              <div class="big-equation"><span class="color-a">{{ selectedFact.a }}</span> + <span class="color-b">{{ selectedFact.b }}</span> = {{ selectedFact.a + selectedFact.b }}</div>
              <p class="viz-hint">Сложим <b class="color-a">{{ selectedFact.a }}</b> синих и <b class="color-b">{{ selectedFact.b }}</b> красных точек:</p>
              <div class="viz-container"><MathVisualizer type="sumsub" :a="selectedFact.a" :b="selectedFact.b" op="plus" /></div>
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
              <div class="medal-icon small-medal" v-if="progress.getSumSubMedal(i) === 3">🥇</div>
              <div class="medal-icon small-medal" v-else-if="progress.getSumSubMedal(i) === 2">🥈</div>
              <div class="medal-icon small-medal" v-else-if="progress.getSumSubMedal(i) === 1">🥉</div>
            </button>
          </div>
        </div>

        <GameTestArea
          :class="{ 'shake': isError }"
          :question="currentQuestionForProps"
          :currentIndex="currentQuestionIndex"
          :total="mode === 'blitz' ? 100 : 10"
          :score="score"
          :highScore="mode === 'blitz' ? progress.blitzHighScore : highScore"
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
                  <MathVisualizer :key="currentQuestion?.text" type="sumsub" :a="currentQuestion.a" :b="currentQuestion.b" :op="currentQuestion.op" :isMini="true" />
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

type Mode = 'learning' | 'test' | 'blitz';
type TestTarget = 'mix' | number;

const mode = ref<Mode>('test');
const maxNumber = ref(20);
const testTarget = ref<TestTarget>('mix');
const activeTable = ref(1);
const selectedFact = ref<{a: number, b: number, op: 'plus'} | null>(null);
const isError = ref(false);

interface MathQuestion { text: string; correctAnswer: number; options: number[]; a: number; b: number; op: 'plus' | 'minus'; }
interface WeightedSumSubFact { a: number; b: number; op: 'plus' | 'minus'; weight: number; }

const currentQuestionIndex = ref(0);
const score = ref(0);
const testFinished = ref(false);
const questions = reactive<MathQuestion[]>([]);
const questionStartTime = ref(0);

const highScore = computed(() => progress.sumSubHighScore);
const currentQuestion = computed(() => questions[currentQuestionIndex.value]);
const currentQuestionForProps = computed(() => currentQuestion.value);
const showRestart = computed(() => true);

watch(maxNumber, () => { if (mode.value === 'test' && testTarget.value === 'mix') resetTest(); });
watch(mode, () => resetTest());

// --- ИСПРАВЛЕНО ---
const goToStats = () => {
  nav.navigate('stats', 'sumsub');
};
// ------------------

const generateTest = () => {
  questions.length = 0;
  const count = mode.value === 'blitz' ? 100 : 10;

  if (testTarget.value !== 'mix' && typeof testTarget.value === 'number') {
    const t = testTarget.value;
    const pool: MathQuestion[] = [];
    for (let i = 1; i <= 10; i++) {
        const ans = t + i;
        pool.push({ text: `${t} + ${i}`, correctAnswer: ans, options: generateOptions(ans), a: t, b: i, op: 'plus' });
        if (t !== i) { pool.push({ text: `${i} + ${t}`, correctAnswer: ans, options: generateOptions(ans), a: i, b: t, op: 'plus' }); }
        pool.push({ text: `${ans} - ${t}`, correctAnswer: i, options: generateOptions(i), a: ans, b: t, op: 'minus' });
    }
    pool.sort(() => Math.random() - 0.5);
    const selected = pool.slice(0, count);
    selected.forEach(item => { questions.push({ ...item, options: generateOptions(item.correctAnswer) }); });
    questionStartTime.value = Date.now();
    return;
  }

  let candidates: WeightedSumSubFact[] = [];
  const fillCandidates = () => {
      const pool: WeightedSumSubFact[] = [];
      for (let a = 1; a < maxNumber.value; a++) {
        for (let b = 1; b <= maxNumber.value - a; b++) {
           pool.push(createWeightedFact(a, b, 'plus'));
        }
      }
      for (let a = 2; a <= maxNumber.value; a++) {
        for (let b = 1; b < a; b++) {
           pool.push(createWeightedFact(a, b, 'minus'));
        }
      }
      return pool;
  };

  candidates = fillCandidates();

  for (let k = 0; k < count; k++) {
    if (candidates.length === 0) {
        if (mode.value === 'blitz') candidates = fillCandidates();
        else break;
    }

    const selected = pickWeighted(candidates);
    const index = candidates.indexOf(selected);
    if (index > -1) candidates.splice(index, 1);

    let text, ans;
    if (selected.op === 'plus') {
       text = `${selected.a} + ${selected.b}`;
       ans = selected.a + selected.b;
    } else {
       text = `${selected.a} - ${selected.b}`;
       ans = selected.a - selected.b;
    }

    questions.push({
       text,
       correctAnswer: ans,
       options: generateOptions(ans),
       a: selected.a,
       b: selected.b,
       op: selected.op
    });
  }

  questionStartTime.value = Date.now();
};

const createWeightedFact = (a: number, b: number, op: 'plus' | 'minus'): WeightedSumSubFact => {
    let v1, v2;
    if (op === 'plus') { v1 = a; v2 = b; }
    else { v1 = b; v2 = a - b; }

    const stat = progress.getSumSubStat(v1, v2);
    const attempts = stat.c + stat.w;

    let weight = 0;

    if (attempts === 0) {
       weight = 1000;
    } else {
       weight = Math.max(1, Math.round(100 / attempts));
    }

    if (op === 'minus') {
        if (attempts < 5) {
            weight += 200;
        } else {
            weight *= 2;
        }
    }

    if (stat.w > 0) weight += 50;

    return { a, b, op, weight };
};

const pickWeighted = (items: WeightedSumSubFact[]): WeightedSumSubFact => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item;
  }
  return items[items.length - 1]!;
};

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateOptions = (correct: number) => { const s = new Set<number>(); s.add(correct); while (s.size < 4) { const dev = getRandomInt(-5, 5); const w = correct + dev; if(w >= 0 && w !== correct) s.add(w); } return Array.from(s).sort(() => Math.random() - 0.5); };

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
  progress.saveSumSubStat(currentQuestion.value.a, currentQuestion.value.b, currentQuestion.value.op, isCorrect, timeTaken);
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
  if (mode.value === 'blitz') { progress.checkNewRecord('blitz', score.value); }
  else { if (score.value > highScore.value) progress.checkNewRecord('sumsub', score.value); if (score.value === 10) progress.registerPerfectTest(); }
};

const resetTest = () => { currentQuestionIndex.value = 0; score.value = 0; testFinished.value = false; generateTest(); };

const setTestTarget = (t: TestTarget) => { testTarget.value = t; resetTest(); };
const selectFact = (a: number, b: number, op: 'plus') => { selectedFact.value = { a, b, op }; };

onMounted(() => generateTest());
</script>

<style scoped></style>
