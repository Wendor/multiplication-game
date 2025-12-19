<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import GameTestArea from '../components/GameTestArea.vue';

type Mode = 'learning' | 'test';
interface Question { a: number; b: number; op: '+' | '-'; correctAnswer: number; options: number[]; }
interface Difficulty { label: string; max: number; }

const difficulties: Difficulty[] = [ { label: 'до 10', max: 10 }, { label: 'до 20', max: 20 }, { label: 'до 50', max: 50 } ];

const mode = ref<Mode>('learning');
const maxNumber = ref(10);
const testTarget = ref('mix');
const selectedA = ref(2);
const selectedB = ref(3);

const currentQuestionIndex = ref(0);
const score = ref(0);
const highScore = ref(0);
const testFinished = ref(false);
const questions = reactive<Question[]>([]);
const currentQuestion = computed(() => questions[currentQuestionIndex.value]);

const currentQuestionForProps = computed(() => {
  if (!currentQuestion.value) return undefined;
  return {
    text: `${currentQuestion.value.a} ${currentQuestion.value.op} ${currentQuestion.value.b}`,
    correctAnswer: currentQuestion.value.correctAnswer,
    options: currentQuestion.value.options
  };
});

watch(maxNumber, () => { if (mode.value === 'test') resetTest(); });

const setMode = (m: Mode) => { mode.value = m; if (m === 'test') resetTest(); };
const setDifficulty = (max: number) => { maxNumber.value = max; };

const onAnswer = (isCorrect: boolean) => { if (isCorrect) score.value++; };
const onNext = () => { if (currentQuestionIndex.value < 9) currentQuestionIndex.value++; else finishGame(); };

const finishGame = () => {
  testFinished.value = true;
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem('sumSubHighScore', highScore.value.toString());
  }
};
const resetTest = () => { currentQuestionIndex.value = 0; score.value = 0; testFinished.value = false; generateTest(); };

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateOptions = (correct: number) => {
  const s = new Set<number>();
  s.add(correct);
  while (s.size < 4) {
    const dev = getRandomInt(-5, 5);
    const w = correct + dev;
    if (w >= 0 && w !== correct) s.add(w);
  }
  return Array.from(s).sort(() => Math.random() - 0.5);
};
const generateTest = () => {
  questions.length = 0;
  for (let i = 0; i < 10; i++) {
    const isPlus = Math.random() > 0.5;
    let a, b, ans;
    if (isPlus) {
      a = getRandomInt(1, maxNumber.value - 1);
      b = getRandomInt(1, maxNumber.value - a);
      ans = a + b;
      questions.push({ a, b, op: '+', correctAnswer: ans, options: generateOptions(ans) });
    } else {
      a = getRandomInt(2, maxNumber.value);
      b = getRandomInt(1, a);
      ans = a - b;
      questions.push({ a, b, op: '-', correctAnswer: ans, options: generateOptions(ans) });
    }
  }
};

onMounted(() => {
  const s = localStorage.getItem('sumSubHighScore');
  if (s) highScore.value = parseInt(s, 10);
  generateTest();
});
</script>

<template>
  <div class="game-container">
    <div class="top-bar">
      <button class="back-btn" @click="$emit('go-home')">←</button>
      <h1>Сложение ±</h1>
      <div class="header-stats">🏆 {{ highScore }}</div>
    </div>

    <div class="controls-area">
      <div class="segmented-control">
        <button :class="{ active: mode === 'learning' }" @click="setMode('learning')">Учить</button>
        <button :class="{ active: mode === 'test' }" @click="setMode('test')">Тест</button>
      </div>
      <transition name="fade">
        <div class="difficulty-selector" v-if="mode === 'learning' || testTarget === 'mix'">
          <div class="chips-row">
            <button v-for="lvl in difficulties" :key="lvl.max" class="chip" :class="{ active: maxNumber === lvl.max }" @click="setDifficulty(lvl.max)">
              {{ lvl.label }}
            </button>
          </div>
        </div>
      </transition>
    </div>

    <transition name="fade-mode" mode="out-in">
      <div v-if="mode === 'learning'" key="learning" class="learning-wrapper">
        <p class="instruction">Выбери два числа:</p>
        <div class="inputs-container">
          <div class="number-nav">
            <button v-for="i in Math.min(10, maxNumber)" :key="'a'+i" class="nav-circle" :class="{ active: selectedA === i }" @click="selectedA = i">{{ i }}</button>
          </div>
          <div class="operator">+</div>
          <div class="number-nav">
            <button v-for="i in Math.min(10, maxNumber)" :key="'b'+i" class="nav-circle" :class="{ active: selectedB === i }" @click="selectedB = i">{{ i }}</button>
          </div>
        </div>
        <div class="visualizer-card-inline">
          <div class="big-equation"><span class="color-a">{{ selectedA }}</span> + <span class="color-b">{{ selectedB }}</span> = {{ selectedA + selectedB }}</div>
          <div class="sum-visualizer">
            <div class="dot-group"><div v-for="n in selectedA" :key="'a'+n" class="dot dot-a" style="animation-delay: 0s"></div></div>
            <div class="plus-sign">+</div>
            <div class="dot-group"><div v-for="n in selectedB" :key="'b'+n" class="dot dot-b" :style="{ animationDelay: (n * 0.05) + 's' }"></div></div>
          </div>
          <p class="hint">Всего точек: {{ selectedA + selectedB }}</p>
        </div>
      </div>

      <div v-else key="test" class="test-wrapper">
        <GameTestArea
          :question="currentQuestionForProps"
          :currentIndex="currentQuestionIndex"
          :total="10"
          :score="score"
          :highScore="highScore"
          :finished="testFinished"
          @answer="onAnswer"
          @next="onNext"
          @restart="resetTest"
        >
          <template #visualizer>
            <div class="test-visualizer" v-if="currentQuestion">
              <div v-if="currentQuestion.op === '+'" class="sum-visualizer mini">
                 <div class="dot-group"><div v-for="n in currentQuestion.a" :key="'ta'+n" class="dot mini-dot dot-a"></div></div>
                 <div class="mini-plus">+</div>
                 <div class="dot-group"><div v-for="n in currentQuestion.b" :key="'tb'+n" class="dot mini-dot dot-b"></div></div>
              </div>
              <div v-else class="sub-visualizer mini">
                 <div v-for="n in currentQuestion.a" :key="'sub'+n"
                      class="dot mini-dot"
                      :class="n > (currentQuestion.a - currentQuestion.b) ? 'crossed-out' : 'dot-a'">
                 </div>
              </div>
            </div>
          </template>
        </GameTestArea>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Добавлено .test-wrapper для верстки */
* { box-sizing: border-box; }
.game-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; width: 100%; max-width: 500px; margin: 0 auto; padding: 10px; min-height: 100vh; color: #333; overflow-x: hidden; }

/* Важное исправление: контейнер теста */
.test-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.top-bar { display: flex; align-items: center; margin-bottom: 15px; gap: 10px; }
.back-btn { background: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; color: #2c3e50; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
h1 { font-size: 1.2rem; margin: 0; color: #2c3e50; flex-grow: 1; }
.header-stats { background: #ffecb3; color: #d35400; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; }
.controls-area { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.segmented-control { display: flex; width: 100%; background: #e0e0e0; padding: 4px; border-radius: 12px; }
.segmented-control button { flex: 1; border: none; background: transparent; padding: 8px 0; border-radius: 8px; font-weight: 600; font-size: 0.9rem; color: #7f8c8d; cursor: pointer; }
.segmented-control button.active { background: white; color: #333; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.chips-row { display: flex; gap: 8px; }
.chip { flex: 1; background: white; border: 1px solid #ddd; padding: 8px 0; border-radius: 12px; font-size: 0.85rem; cursor: pointer; text-align: center; }
.chip.active { background: #9b59b6; color: white; border-color: #8e44ad; }
.instruction { text-align: center; color: #7f8c8d; margin-bottom: 10px; font-size: 0.9rem; }
.inputs-container { display: flex; flex-direction: column; gap: 10px; align-items: center; margin-bottom: 20px; }
.number-nav { display: flex; overflow-x: auto; gap: 8px; padding: 5px; max-width: 100%; scrollbar-width: none; }
.number-nav::-webkit-scrollbar { display: none; }
.nav-circle { flex: 0 0 40px; height: 40px; border-radius: 50%; background: white; border: 2px solid #eee; font-weight: bold; color: #555; font-size: 1.1rem; }
.nav-circle.active { background: #9b59b6; color: white; border-color: #8e44ad; transform: scale(1.1); }
.operator { font-size: 24px; font-weight: bold; color: #aaa; }
.visualizer-card-inline { background: white; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.big-equation { font-size: 2rem; font-weight: 800; margin-bottom: 20px; color: #2c3e50; }
.color-a { color: #3498db; }
.color-b { color: #e74c3c; }
.sum-visualizer { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }
.dot-group { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; max-width: 150px; }
.dot { width: 16px; height: 16px; border-radius: 50%; animation: pop 0.3s backwards; }
.dot-a { background: #3498db; }
.dot-b { background: #e74c3c; }
.plus-sign { font-size: 24px; color: #aaa; font-weight: bold; }
.hint { margin-top: 15px; color: #95a5a6; font-style: italic; }
.test-visualizer { display: flex; justify-content: center; padding: 10px; background: #fafafa; border-radius: 12px; width: 100%; margin-bottom: 20px; }
.mini-dot { width: 12px; height: 12px; }
.mini-plus { font-weight: bold; color: #aaa; }
.crossed-out { background: #ddd; position: relative; }
.crossed-out::after { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: #e74c3c; transform: rotate(-45deg); }
.sub-visualizer { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
.fade-mode-enter-active, .fade-mode-leave-active { transition: opacity 0.3s ease; }
.fade-mode-enter-from, .fade-mode-leave-to { opacity: 0; }
@keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }
</style>
