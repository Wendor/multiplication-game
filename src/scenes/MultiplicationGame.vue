<template>
  <div class="page-container">
    <TopBar title="Умножение">
      <span v-if="mode === 'blitz'">⚡ {{ blitzHighScore }}</span>
      <span v-else>🏆 {{ progress.totalSolved }}</span>
    </TopBar>

    <GameControls
      v-model:mode="mode"
      :mistakesCount="mistakesCount"
      :showDifficulty="(mode === 'learning' || testTarget === 'mix') && mode !== 'mistakes' && mode !== 'blitz'"
      v-model:currentDifficulty="maxNumber"
      :difficultyOptions="[
        { label: 'до 5', value: 5 },
        { label: 'до 8', value: 8 },
        { label: 'до 10', value: 10 }
      ]"
    />

    <transition name="fade-mode" mode="out-in">
      <div v-if="mode === 'learning'" key="learning" class="learning-wrapper">
        <LearningNav
          v-model="activeTable"
          :total="maxNumber"
          :getMedal="progress.getMedalForNumber"
        />

        <transition name="slide-up-fade" mode="out-in">
          <div :key="activeTable" class="single-table-view">
            <h2 class="table-title">Таблица на {{ activeTable }}</h2>
            <div class="rows-container">
              <div v-for="j in 10" :key="j" class="table-row-large" :class="{ 'row-selected': selectedFact?.a === activeTable && selectedFact?.b === j }" @click="selectFact(activeTable, j)">
                <div class="row-content">
                  <span class="num">{{ activeTable }}</span><span class="sign">×</span><span class="num">{{ j }}</span><span class="sign">=</span>
                  <span class="result-box revealed">{{ activeTable * j }}</span>
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
              <div class="big-equation"><span class="color-a">{{ selectedFact.a }}</span> × <span class="color-b">{{ selectedFact.b }}</span> = {{ selectedFact.a * selectedFact.b }}</div>
              <div class="viz-container">
                <MathVisualizer type="multiplication" :a="selectedFact.a" :b="selectedFact.b" />
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
              <div class="medal-icon small-medal" v-if="progress.getMedalForNumber(i) === 3">🥇</div>
              <div class="medal-icon small-medal" v-else-if="progress.getMedalForNumber(i) === 2">🥈</div>
              <div class="medal-icon small-medal" v-else-if="progress.getMedalForNumber(i) === 1">🥉</div>
            </button>
          </div>
        </div>

        <div v-if="mode === 'mistakes' && !testFinished" class="mistakes-title">Отработка ошибок 🩹</div>

        <GameTestArea
          :class="{ 'shake': isError }"
          :question="currentQuestionForProps"
          :currentIndex="currentQuestionIndex"
          :total="mode === 'mistakes' ? questions.length : 10"
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
               <p class="test-viz-hint">Подсказка (ряды × штуки):</p>
               <div class="test-visualizer">
                  <MathVisualizer :key="currentQuestion?.text" type="multiplication" :a="currentQuestion.a" :b="currentQuestion.b" :isMini="true"/>
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
import { useAudio } from '../composables/useAudio';
import { useHaptics } from '../composables/useHaptics';
import confetti from 'canvas-confetti';

const progress = useProgressStore();
const { playCorrect, playWrong, playWin } = useAudio();
const { vibrateMedium, vibrateError, vibrateWin } = useHaptics();

type Mode = 'learning' | 'test' | 'blitz' | 'mistakes';
type TestTarget = 'mix' | number;
interface Question { text: string; a: number; b: number; correctAnswer: number; options: number[]; }
interface Fact { a: number; b: number; }
interface WeightedFact { a: number; b: number; weight: number; }

const mode = ref<Mode>('test');
const maxNumber = ref(10);
const activeTable = ref(2);
const testTarget = ref<TestTarget>('mix');
const currentQuestionIndex = ref(0);
const score = ref(0);
const testFinished = ref(false);
const questions = reactive<Question[]>([]);
const selectedFact = ref<Fact | null>(null);
const questionStartTime = ref(0);
const isError = ref(false);

const highScore = computed(() => progress.multiplicationHighScore);
const blitzHighScore = computed(() => progress.blitzHighScore);
const mistakesCount = computed(() => progress.getMistakes().length);
const currentQuestion = computed(() => questions[currentQuestionIndex.value]);
const currentQuestionForProps = computed(() => currentQuestion.value);

watch(maxNumber, (newMax) => { if (activeTable.value > newMax) activeTable.value = newMax; if (mode.value === 'test' && testTarget.value === 'mix') resetTest(); });

const generateTest = () => {
  questions.length = 0;
  if (mode.value === 'mistakes') {
    const errors = progress.getMistakes();
    errors.sort(() => Math.random() - 0.5);
    const selected = errors.slice(0, 10);
    selected.forEach(p => { const ans = p.a * p.b; questions.push({ text: `${p.a} × ${p.b}`, a: p.a, b: p.b, correctAnswer: ans, options: generateOptions(ans) }); });
    questionStartTime.value = Date.now();
    return;
  }
  const limit = mode.value === 'blitz' ? 100 : 10;
  let candidates: WeightedFact[] = [];
  const fillCandidates = () => {
    const newPool: WeightedFact[] = [];
    if (testTarget.value === 'mix' || mode.value === 'blitz') {
      for (let i = 2; i <= maxNumber.value; i++) { for (let j = i; j <= maxNumber.value; j++) newPool.push(createWeightedFact(i, j)); }
    } else { const target = testTarget.value as number; for (let i = 1; i <= 10; i++) newPool.push(createWeightedFact(target, i)); }
    return newPool;
  };
  candidates = fillCandidates();
  for (let k = 0; k < limit; k++) {
    if (candidates.length === 0) { if (mode.value === 'blitz') candidates = fillCandidates(); else break; }
    const selected = pickWeighted(candidates);
    const index = candidates.indexOf(selected);
    if (index > -1) candidates.splice(index, 1);
    const swap = Math.random() > 0.5;
    const finalA = swap ? selected.b : selected.a;
    const finalB = swap ? selected.a : selected.b;
    const ans = finalA * finalB;
    questions.push({ text: `${finalA} × ${finalB}`, a: finalA, b: finalB, correctAnswer: ans, options: generateOptions(ans) });
  }
  questionStartTime.value = Date.now();
};

const createWeightedFact = (a: number, b: number): WeightedFact => {
  const stat = progress.getStat(a, b);
  let weight = 10; if (stat.w > 0) weight += (stat.w * 50); if (stat.c > 5 && stat.w === 0) weight = 1; else if (stat.c > 2) weight = 5;
  return { a, b, weight };
};
const pickWeighted = (items: WeightedFact[]): WeightedFact => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight; for (const item of items) { random -= item.weight; if (random <= 0) return item; }
  return items[items.length - 1]!;
};
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateOptions = (correct: number) => { const s = new Set<number>(); s.add(correct); while (s.size < 4) { const dev = getRandomInt(-5, 5); const w = correct + dev; if (w > 0 && w !== correct) s.add(w); } return Array.from(s).sort(() => Math.random() - 0.5); };

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
  progress.saveStat(currentQuestion.value.a, currentQuestion.value.b, isCorrect, timeTaken);
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
  else if (mode.value === 'test') { progress.checkNewRecord('multiplication', score.value); if (score.value === 10) progress.registerPerfectTest(); }
};

const resetTest = () => { currentQuestionIndex.value = 0; score.value = 0; testFinished.value = false; generateTest(); };
const setTestTarget = (target: TestTarget) => { testTarget.value = target; resetTest(); };
const selectFact = (a: number, b: number) => { if (selectedFact.value?.a === a && selectedFact.value?.b === b) selectedFact.value = null; else selectedFact.value = { a, b }; };
onMounted(() => { generateTest(); });
</script>

<style scoped></style>
