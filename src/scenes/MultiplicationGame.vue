<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import GameTestArea from '../components/GameTestArea.vue';

// ... ВЕСЬ КОД SCRIPT ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ ИЗ ПРЕДЫДУЩЕГО ШАГА ...
// (Для экономии места я его не дублирую, так как меняем только верстку)
type Mode = 'learning' | 'test';
type TestTarget = 'mix' | number;
interface Question { a: number; b: number; correctAnswer: number; options: number[]; }
interface Difficulty { shortLabel: string; max: number; }
interface Fact { a: number; b: number; }

const difficulties: Difficulty[] = [ { shortLabel: 'до 5', max: 5 }, { shortLabel: 'до 8', max: 8 }, { shortLabel: 'до 10', max: 10 } ];

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

const currentQuestionForProps = computed(() => {
  if (!currentQuestion.value) return undefined;
  return {
    text: `${currentQuestion.value.a} × ${currentQuestion.value.b}`,
    correctAnswer: currentQuestion.value.correctAnswer,
    options: currentQuestion.value.options
  };
});

watch(maxNumber, (newMax) => {
  if (activeTable.value > newMax) activeTable.value = newMax;
  if (mode.value === 'test' && testTarget.value === 'mix') resetTest();
});

const onAnswer = (isCorrect: boolean) => { if (isCorrect) score.value++; };
const onNext = () => { if (currentQuestionIndex.value < 9) currentQuestionIndex.value++; else finishGame(); };

const finishGame = () => {
  testFinished.value = true;
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem('multiplicationHighScore', highScore.value.toString());
  }
};
const resetTest = () => { currentQuestionIndex.value = 0; score.value = 0; testFinished.value = false; generateTest(); };

const setMode = (newMode: Mode) => { mode.value = newMode; if (newMode === 'test') resetTest(); else selectedFact.value = null; };
const setDifficulty = (max: number) => { maxNumber.value = max; };
const setTestTarget = (target: TestTarget) => { testTarget.value = target; resetTest(); };
const selectFact = (a: number, b: number) => { if (selectedFact.value?.a === a && selectedFact.value?.b === b) selectedFact.value = null; else selectedFact.value = { a, b }; };
const getRowWord = (num: number) => { const lastDigit = num % 10; if (num > 10 && num < 20) return 'рядов'; if (lastDigit === 1) return 'ряд'; if (lastDigit >= 2 && lastDigit <= 4) return 'ряда'; return 'рядов'; };
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateOptions = (correct: number) => { const s = new Set<number>(); s.add(correct); while (s.size < 4) { const dev = getRandomInt(-5, 5); const w = correct + dev; if (w > 0 && w !== correct) s.add(w); } return Array.from(s).sort(() => Math.random() - 0.5); };
const generateTest = () => { questions.length = 0; if (testTarget.value === 'mix') { const uniquePairs: Fact[] = []; const start = 2; for (let i = start; i <= maxNumber.value; i++) { for (let j = i; j <= maxNumber.value; j++) uniquePairs.push({ a: i, b: j }); } uniquePairs.sort(() => Math.random() - 0.5); uniquePairs.slice(0, 10).forEach(p => { const swap = Math.random() > 0.5; const finalA = swap ? p.b : p.a; const finalB = swap ? p.a : p.b; const ans = finalA * finalB; questions.push({ a: finalA, b: finalB, correctAnswer: ans, options: generateOptions(ans) }); }); } else { const multiplier = testTarget.value as number; [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(() => Math.random() - 0.5).forEach(f => { const swap = Math.random() > 0.5; const finalA = swap ? f : multiplier; const finalB = swap ? multiplier : f; const ans = finalA * finalB; questions.push({ a: finalA, b: finalB, correctAnswer: ans, options: generateOptions(ans) }); }); } };

onMounted(() => {
  const s = localStorage.getItem('multiplicationHighScore');
  if (s) highScore.value = parseInt(s, 10);
  generateTest();
});
</script>

<template>
  <div class="game-container">
    <div class="top-bar">
      <button class="back-btn" @click="$emit('go-home')">←</button>
      <h1>Умножение</h1>
      <div class="header-stats"><span>🏆 {{ highScore }}</span></div>
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
              {{ lvl.shortLabel }}
            </button>
          </div>
        </div>
      </transition>
    </div>

    <transition name="fade-mode" mode="out-in">
      <div v-if="mode === 'learning'" key="learning" class="learning-wrapper">
        <div class="number-nav">
          <button v-for="i in maxNumber" :key="i" class="nav-circle" :class="{ active: activeTable === i }" @click="activeTable = i">{{ i }}</button>
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
              <div v-for="j in 10" :key="j" class="table-row-large" :class="{ 'row-selected': selectedFact?.a === activeTable && selectedFact?.b === j }" @click="selectFact(activeTable, j)">
                <div class="row-content">
                  <span class="num">{{ activeTable }}</span><span class="sign">×</span><span class="num">{{ j }}</span><span class="sign">=</span>
                  <span class="result-box" :class="{ 'revealed': !hideAnswers || (selectedFact?.a === activeTable && selectedFact?.b === j), 'hidden': hideAnswers && !(selectedFact?.a === activeTable && selectedFact?.b === j) }">{{ activeTable * j }}</span>
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
                <div class="col-header"><span class="color-b">{{ selectedFact.b }} шт. в ряду</span><div class="bracket-hor"></div></div>
                <div class="row-wrapper">
                  <div class="row-header"><span class="color-a">{{ selectedFact.a }} {{ getRowWord(selectedFact.a) }}</span><div class="bracket-vert"></div></div>
                  <div class="dots-grid" :style="{ gridTemplateColumns: `repeat(${selectedFact.b}, 1fr)` }">
                    <div v-for="n in (selectedFact.a * selectedFact.b)" :key="n" class="dot learning-dot" :style="{ animationDelay: `${n * 0.02}s` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div v-else-if="mode === 'test'" key="test" class="test-wrapper">
        <div class="test-settings" v-if="!testFinished">
          <div class="number-nav compact-nav">
            <button class="nav-pill" :class="{ active: testTarget === 'mix' }" @click="setTestTarget('mix')">🔀 Микс</button>
            <button v-for="i in 10" :key="i" class="nav-circle small" :class="{ active: testTarget === i }" @click="setTestTarget(i)">{{ i }}</button>
          </div>
        </div>

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
            <div class="test-visualizer-container" v-if="currentQuestion">
              <p class="test-viz-hint">Подсказка (ряды × штуки):</p>
              <div class="test-visualizer">
                <div class="dots-grid mini-grid" :style="{ gridTemplateColumns: `repeat(${currentQuestion.b}, 1fr)` }">
                  <div v-for="n in (currentQuestion.a * currentQuestion.b)" :key="n" class="dot mini-dot" :style="{ animationDelay: `${n * 0.015}s` }"></div>
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
/* ВНИМАНИЕ: Здесь добавлено .test-wrapper для исправления верстки */
* { box-sizing: border-box; }
.game-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; width: 100%; max-width: 500px; margin: 0 auto; padding: 10px; min-height: 100vh; color: #333; overflow-x: hidden; }

/* Важное исправление: контейнер теста */
.test-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center; /* Центрирует GameTestArea и настройки */
}

/* Остальные стили */
.top-bar { display: flex; align-items: center; margin-bottom: 15px; gap: 10px; }
.back-btn { background: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; color: #2c3e50; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
h1 { font-size: 1.2rem; margin: 0; color: #2c3e50; flex-grow: 1; }
.header-stats { background: #ffecb3; color: #d35400; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; white-space: nowrap; }
.controls-area { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.segmented-control { display: flex; width: 100%; background: #e0e0e0; padding: 4px; border-radius: 12px; }
.segmented-control button { flex: 1; border: none; background: transparent; padding: 8px 0; border-radius: 8px; font-weight: 600; font-size: 0.9rem; color: #7f8c8d; cursor: pointer; }
.segmented-control button.active { background: white; color: #333; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.difficulty-selector { width: 100%; }
.chips-row { display: flex; width: 100%; gap: 8px; }
.chip { flex: 1; background: white; border: 1px solid #ddd; padding: 8px 0; border-radius: 12px; font-size: 0.85rem; cursor: pointer; color: #555; text-align: center; white-space: nowrap; transition: all 0.2s; }
.chip.active { background: #3498db; color: white; border-color: #3498db; }
.number-nav { display: flex; overflow-x: auto; gap: 8px; padding: 10px 5px; margin: 0 -10px 10px -10px; padding-left: 10px; padding-right: 10px; scrollbar-width: none; -ms-overflow-style: none; }
.number-nav::-webkit-scrollbar { display: none; }
.nav-circle { flex: 0 0 44px; height: 44px; border-radius: 50%; background: white; border: 2px solid #eee; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: bold; color: #555; transition: transform 0.2s; }
.nav-circle.active { background: #3498db; color: white; border-color: #3498db; transform: scale(1.1); box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3); }
.nav-pill { flex: 0 0 auto; padding: 0 16px; height: 44px; border-radius: 22px; background: white; border: 2px solid #eee; font-weight: bold; color: #555; display: flex; align-items: center; justify-content: center; }
.nav-pill.active { background: #9b59b6; color: white; border-color: #8e44ad; }
.single-table-view { background: white; border-radius: 16px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.table-title { text-align: center; margin: 0 0 15px; font-size: 1.2rem; color: #2c3e50; }
.table-row-large { padding: 12px 0; border-bottom: 1px solid #f1f1f1; }
.row-content { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1.3rem; font-weight: 500; }
.num { width: 1.5em; text-align: center; font-weight: 700; }
.result-box { width: 2em; text-align: center; font-weight: 800; }
.result-box.revealed { color: #27ae60; }
.result-box.hidden { color: #e0e0e0; }
.toggle-row { display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 15px; }
.toggle-switch { position: relative; width: 40px; height: 22px; }
.toggle-switch input { display: none; }
.slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; border-radius: 34px; transition: .4s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px; background-color: white; border-radius: 50%; transition: .4s; }
input:checked + .slider { background-color: #2ecc71; }
input:checked + .slider:before { transform: translateX(18px); }
.test-settings { margin-bottom: 10px; width: 100%; display: flex; justify-content: center; }
.test-visualizer-container { width: 100%; margin-bottom: 20px; }
.test-viz-hint { text-align: center; color: #95a5a6; font-size: 0.9rem; margin-bottom: 8px; }
.test-visualizer { display: flex; justify-content: center; padding: 15px; background: #fafafa; border-radius: 12px; width: 100%; }
.mini-grid { gap: 8px; display: grid; }
.mini-dot { width: 18px; height: 18px; background: #3498db; box-shadow: inset 0 -2px 0 rgba(0,0,0,0.1); border-radius: 50%; }
.dots-grid { display: grid; gap: 8px; justify-content: center; }
.dot { border-radius: 50%; animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards; }
.learning-dot { width: 16px; height: 16px; background: #e74c3c; }
.viz-container { display: flex; flex-direction: column; align-items: center; margin: 20px 0; }
.col-header { text-align: center; font-weight: bold; color: #555; margin-bottom: 5px; display: flex; flex-direction: column; align-items: center; }
.bracket-hor { width: 100%; height: 10px; border-bottom: 2px solid #ccc; border-left: 2px solid #ccc; border-right: 2px solid #ccc; margin-top: 2px; }
.row-wrapper { display: flex; align-items: center; gap: 10px; }
.row-header { display: flex; align-items: center; font-weight: bold; color: #555; }
.bracket-vert { height: 100%; width: 10px; border-right: 2px solid #ccc; border-top: 2px solid #ccc; border-bottom: 2px solid #ccc; margin-left: 5px; }
.color-a { color: #e67e22; }
.color-b { color: #27ae60; }
.big-equation .color-a, .big-equation .color-b { font-weight: 900; }
.visualizer-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 99; }
.visualizer-panel { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; }
.visualizer-card { background: white; border-radius: 20px 20px 0 0; padding: 20px; text-align: center; padding-bottom: 40px; max-height: 80vh; display: flex; flex-direction: column; }
.close-btn-mobile { position: absolute; top: 10px; right: 10px; background: #f1f2f6; border: none; width: 30px; height: 30px; border-radius: 50%; font-weight: bold; color: #7f8c8d; }
.dots-wrapper { overflow-y: auto; display: flex; justify-content: center; flex-grow: 1; }
.visualizer-hint { font-style: italic; color: #7f8c8d; margin-top: 15px; }
.slide-up-panel-enter-active, .slide-up-panel-leave-active { transition: transform 0.3s ease; }
.slide-up-panel-enter-from, .slide-up-panel-leave-to { transform: translateY(100%); }
.slide-up-fade-enter-active, .slide-up-fade-leave-active { transition: opacity 0.3s; }
.slide-up-fade-enter-from, .slide-up-fade-leave-to { opacity: 0; }
.fade-mode-enter-active, .fade-mode-leave-active { transition: opacity 0.3s ease; }
.fade-mode-enter-from, .fade-mode-leave-to { opacity: 0; }
@keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
