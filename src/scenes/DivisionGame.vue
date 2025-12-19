<template>
  <div class="game-container">
    <div class="top-bar">
      <button class="back-btn" @click="nav.goBack()">←</button>
      <h1>Деление</h1>
      <div class="header-stats">🏆 {{ progress.totalSolved }}</div>
    </div>

    <div class="controls-area">
      <div class="segmented-control">
        <button :class="{ active: mode === 'test' }" @click="setMode('test')">Тест</button>
        <button :class="{ active: mode === 'learning' }" @click="setMode('learning')">Учить</button>
      </div>

      <transition name="fade">
        <div class="difficulty-selector" v-if="mode === 'learning' || testTarget === 'mix'">
          <div class="chips-row">
            <button
              v-for="num in 9"
              :key="num + 1"
              class="chip"
              :class="{ active: divisor === (num + 1) }"
              @click="setDivisor(num + 1)"
            >
              ÷{{ num + 1 }}
            </button>
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
            :class="{ active: activeResult === i }"
            @click="activeResult = i"
          >
            {{ i * divisor }}
          </button>
        </div>

        <div class="visualizer-card-inline">
          <div class="big-equation">
            <span class="color-a">{{ activeResult * divisor }}</span> ÷ <span class="color-b">{{ divisor }}</span> = {{ activeResult }}
          </div>

          <div class="viz-container">
            <p class="hint-text">
              Сколько раз число <b>{{ divisor }}</b> помещается в <b>{{ activeResult * divisor }}</b>?
            </p>

            <div class="dots-grid" :style="{ gridTemplateColumns: `repeat(${divisor}, 1fr)` }">
              <div
                v-for="n in (activeResult * divisor)"
                :key="n"
                class="dot learning-dot"
                :style="{ animationDelay: `${n * 0.02}s` }"
                :class="{ 'group-end': n % divisor === 0 }"
              ></div>
            </div>
            <p class="answer-hint">Ответ: {{ activeResult }} раза</p>
          </div>
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
              <div class="division-viz">
                 <div class="dots-grid mini-grid" :style="{ gridTemplateColumns: `repeat(${currentQuestion.b}, 1fr)` }">
                    <div
                      v-for="n in (currentQuestion.a)"
                      :key="n"
                      class="dot mini-dot"
                      :style="{ animationDelay: `${n * 0.01}s` }"
                    ></div>
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
import { ref, reactive, computed, onMounted } from 'vue';
import GameTestArea from '../components/GameTestArea.vue';
import { useNavigationStore } from '../stores/navigation';
import { useProgressStore } from '../stores/progress';

const nav = useNavigationStore();
const progress = useProgressStore();

type Mode = 'learning' | 'test';
type TestTarget = 'mix' | number;

// В делении: a (делимое) ÷ b (делитель) = correctAnswer
interface Question { a: number; b: number; correctAnswer: number; options: number[]; }

const mode = ref<Mode>('test');
const divisor = ref(2); // На что делим (делитель)
const activeResult = ref(1); // Результат (частное), чтобы вычислить делимое
const testTarget = ref<TestTarget>('mix');

const currentQuestionIndex = ref(0);
const score = ref(0);
const highScore = ref(0); // Можно вынести в Pinia отдельный рекорд для деления
const testFinished = ref(false);
const questions = reactive<Question[]>([]);
const currentQuestion = computed(() => questions[currentQuestionIndex.value]);

const currentQuestionForProps = computed(() => {
  if (!currentQuestion.value) return undefined;
  return {
    text: `${currentQuestion.value.a} ÷ ${currentQuestion.value.b}`,
    correctAnswer: currentQuestion.value.correctAnswer,
    options: currentQuestion.value.options
  };
});

// Сохраняем рекорд локально для простоты примера, или добавьте в store
const loadHighScore = () => {
  const s = localStorage.getItem('divisionHighScore');
  if (s) highScore.value = parseInt(s, 10);
};

const setMode = (m: Mode) => { mode.value = m; if (m === 'test') resetTest(); };
const setDivisor = (d: number) => { divisor.value = d; activeResult.value = 1; if(mode.value === 'test') resetTest(); };

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateOptions = (correct: number) => {
  const s = new Set<number>();
  s.add(correct);
  while (s.size < 4) {
    const dev = getRandomInt(-4, 4);
    const w = correct + dev;
    if (w > 0 && w !== correct) s.add(w);
  }
  return Array.from(s).sort(() => Math.random() - 0.5);
};

const generateTest = () => {
  questions.length = 0;
  for (let i = 0; i < 10; i++) {
    // Генерируем "обратное умножение"
    // Ответ (частное) от 2 до 10
    const result = getRandomInt(2, 10);
    // Делитель от 2 до 9
    const div = getRandomInt(2, 9);

    // Делимое
    const dividend = result * div;

    questions.push({
      a: dividend,
      b: div,
      correctAnswer: result,
      options: generateOptions(result)
    });
  }
};

const onAnswer = (isCorrect: boolean) => {
  if (isCorrect) {
    score.value++;
    progress.incrementTotalSolved();
  }
};
const onNext = () => { if (currentQuestionIndex.value < 9) currentQuestionIndex.value++; else finishGame(); };

const finishGame = () => {
  testFinished.value = true;
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem('divisionHighScore', highScore.value.toString());
  }
};
const resetTest = () => { currentQuestionIndex.value = 0; score.value = 0; testFinished.value = false; generateTest(); };

onMounted(() => {
  loadHighScore();
  generateTest();
});
</script>

<style scoped>
/* Используем те же стили, что и везде */
* { box-sizing: border-box; }
.game-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 10px;
  background-color: #f4f6f8;
  min-height: 100vh;
  color: #333;
  /* УДАЛЕНО: overflow-x: hidden; — это ломало sticky */
}

.top-bar {
  /* Логика прилипания */
  position: sticky;
  top: 0;
  z-index: 100;

  /* Фон (полупрозрачный с размытием для красоты) */
  background-color: rgba(244, 246, 248, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);

  /* Компенсация padding: 10px у родителя .game-container */
  /* Растягиваем шапку на всю ширину и прижимаем к верху */
  margin: -10px -10px 15px -10px;
  padding: 10px 15px; /* Внутренние отступы */
  width: calc(100% + 20px); /* Ширина 100% + 20px (компенсация отступов) */

  /* Flexbox */
  display: flex;
  align-items: center;
  gap: 10px;
}
.back-btn { background: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; color: #2c3e50; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
h1 { font-size: 1.2rem; margin: 0; color: #2c3e50; flex-grow: 1; }
.header-stats { background: #ffecb3; color: #d35400; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; }

.controls-area { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.segmented-control { display: flex; width: 100%; background: #e0e0e0; padding: 4px; border-radius: 12px; }
.segmented-control button { flex: 1; border: none; background: transparent; padding: 8px 0; border-radius: 8px; font-weight: 600; font-size: 0.9rem; color: #7f8c8d; cursor: pointer; }
.segmented-control button.active { background: white; color: #333; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

/* Чипсы для выбора делителя */
.chips-row { display: flex; width: 100%; gap: 6px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
.chips-row::-webkit-scrollbar { display: none; }
.chip { flex: 0 0 auto; background: white; border: 1px solid #ddd; padding: 8px 12px; border-radius: 12px; font-size: 0.9rem; cursor: pointer; color: #555; transition: all 0.2s; }
.chip.active { background: #e67e22; color: white; border-color: #d35400; }

.learning-wrapper { display: flex; flex-direction: column; align-items: center; }
.number-nav { display: flex; overflow-x: auto; gap: 8px; padding: 5px; width: 100%; scrollbar-width: none; margin-bottom: 15px; }
.nav-circle { flex: 0 0 45px; height: 45px; border-radius: 50%; background: white; border: 2px solid #eee; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem; color: #555; }
.nav-circle.active { background: #e67e22; color: white; border-color: #d35400; transform: scale(1.1); }

.visualizer-card-inline { background: white; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 100%; }
.big-equation { font-size: 2rem; font-weight: 800; margin-bottom: 15px; color: #2c3e50; }
.color-a { color: #e67e22; }
.color-b { color: #3498db; }

.viz-container { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.hint-text { color: #7f8c8d; font-size: 0.95rem; margin: 0; }
.answer-hint { font-weight: bold; color: #27ae60; margin-top: 10px; }

.dots-grid { display: grid; gap: 6px; justify-content: center; margin-top: 10px; }
.dot { width: 14px; height: 14px; border-radius: 50%; background: #bdc3c7; }
.learning-dot { background: #e67e22; }

.mini-grid { gap: 4px; }
.mini-dot { width: 10px; height: 10px; background: #e67e22; }

.test-wrapper { width: 100%; display: flex; flex-direction: column; align-items: center; }
.test-visualizer { display: flex; justify-content: center; padding: 15px; background: #fafafa; border-radius: 12px; width: 100%; }
</style>
