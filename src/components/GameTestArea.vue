<template>
  <div class="test-area-container">
    <div v-if="!finished" class="content-wrapper">

      <div class="progress-wrapper">

        <div v-if="isBlitz" class="blitz-header">
          <div class="timer-text">⏱️ {{ timeLeft }} сек</div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill blitz-fill" :style="{ width: (timeLeft / totalTime) * 100 + '%' }"></div>
          </div>
        </div>

        <div v-else>
          <div class="progress-text">
            Вопрос <span>{{ currentIndex + 1 }}</span> из {{ total }}
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: ((currentIndex) / total) * 100 + '%' }"></div>
          </div>
        </div>

      </div>

      <div class="question-card" v-if="question">
        <div class="question-text">
          {{ question.text }} = <span class="q-mark">?</span>
        </div>

        <div class="visualizer-slot-wrapper" v-if="!isBlitz">
          <slot name="visualizer"></slot>
        </div>

        <div class="options-grid">
          <button
            v-for="option in question.options"
            :key="option"
            @click="handleAnswerClick(option)"
            class="option-button"
            :class="getButtonClass(option)"
            :disabled="isAnswered"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="results">
      <h2>{{ isBlitz ? 'Время вышло!' : 'Финиш!' }}</h2>

      <div class="final-score-circle">
        {{ score }}
      </div>
      <p v-if="isBlitz" class="subtitle">примеров решено</p>

      <p v-if="score > highScore" class="new-record">🏆 Новый рекорд!</p>
      <p v-else class="encouragement">Молодец!</p>

      <button @click="$emit('restart')" class="main-action-button">Ещё раз</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useGameEffects } from '../composables/useGameEffects';

const props = defineProps<{
  question: { text: string; correctAnswer: number; options: number[] } | undefined;
  currentIndex: number;
  total: number;
  score: number;
  highScore: number;
  finished: boolean;
  isBlitz?: boolean;
}>();

const emit = defineEmits<{
  (e: 'answer', isCorrect: boolean): void;
  (e: 'next'): void;
  (e: 'restart'): void;
  (e: 'time-up'): void;
}>();

const isAnswered = ref(false);
const selectedOption = ref<number | null>(null);
const { playCorrect, playWrong, playWin, runConfetti } = useGameEffects();

// --- Логика Таймера ---
const totalTime = 60;
const timeLeft = ref(totalTime);
// ИСПРАВЛЕНО: Заменили any на number | null
let timerInterval: number | null = null;

const startTimer = () => {
  if (!props.isBlitz) return;
  timeLeft.value = totalTime;
  // setInterval возвращает число в браузере
  timerInterval = window.setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      stopTimer();
      emit('time-up');
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

onMounted(() => {
  if (props.isBlitz) startTimer();
});
onUnmounted(() => stopTimer());
// ----------------------

watch(() => props.question, () => {
  isAnswered.value = false;
  selectedOption.value = null;
});

watch(() => props.finished, (isFinished) => {
  if (isFinished) {
    stopTimer();
    const threshold = props.isBlitz ? 15 : (props.total - 1);
    if (props.score >= threshold) {
      playWin();
      runConfetti();
    }
  }
});

const handleAnswerClick = async (option: number) => {
  if (isAnswered.value || !props.question) return;

  isAnswered.value = true;
  selectedOption.value = option;

  const isCorrect = option === props.question.correctAnswer;

  if (isCorrect) playCorrect();
  else playWrong();

  emit('answer', isCorrect);

  const delay = props.isBlitz ? 500 : 1000;
  await new Promise(resolve => setTimeout(resolve, delay));

  emit('next');
};

const getButtonClass = (option: number) => {
  if (!isAnswered.value) return '';
  const correct = props.question?.correctAnswer;
  if (option === correct) return 'btn-correct';
  if (option === selectedOption.value && option !== correct) return 'btn-wrong';
  return 'btn-dimmed';
};
</script>

<style scoped>
/* Те же стили + новые для блица */
.test-area-container { width: 100%; display: flex; flex-direction: column; align-items: center; }
.content-wrapper { width: 100%; display: flex; flex-direction: column; align-items: center; }
.progress-wrapper { margin-bottom: 25px; padding: 0 5px; width: 100%; max-width: 400px; }

/* Blitz Header */
.blitz-header { display: flex; flex-direction: column; gap: 5px; }
.timer-text { font-size: 1.2rem; font-weight: 800; color: #e67e22; text-align: center; }
.blitz-fill { background: linear-gradient(90deg, #f1c40f, #e67e22) !important; transition: width 1s linear !important; }

.progress-text { text-align: center; font-size: 1.1rem; font-weight: 600; color: #7f8c8d; margin-bottom: 10px; }
.progress-text span { color: #2c3e50; font-weight: 800; font-size: 1.2rem; }
.progress-bar-track { height: 12px; background: #e9ecef; border-radius: 6px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #3498db, #5dade2); border-radius: 6px; transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1); }

.question-card { width: 100%; max-width: 400px; background: white; border-radius: 20px; padding: 20px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center; box-sizing: border-box; }
.question-text { font-size: clamp(2rem, 9vw, 3.5rem); font-weight: 800; margin-bottom: 20px; text-align: center; line-height: 1.2; word-break: break-word; }
.q-mark { color: #3498db; }
.visualizer-slot-wrapper { width: 100%; margin-bottom: 20px; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; width: 100%; gap: 12px; }
.option-button { width: 100%; min-height: 65px; background: white; border: 2px solid #e0e0e0; border-radius: 14px; font-size: 1.5rem; font-weight: 700; color: #333; display: flex; align-items: center; justify-content: center; touch-action: manipulation; transition: all 0.2s ease; padding: 5px; }
.option-button:active { background: #f0f0f0; transform: scale(0.98); }
.btn-correct { background-color: #2ecc71 !important; color: white !important; border-color: #27ae60 !important; transform: scale(1.02); }
.btn-wrong { background-color: #e74c3c !important; color: white !important; border-color: #c0392b !important; animation: shake 0.4s; }
.btn-dimmed { opacity: 0.4; pointer-events: none; }
.results { text-align: center; padding: 10px; width: 100%; }
.final-score-circle { width: 110px; height: 110px; background: #2ecc71; color: white; font-size: 2.2rem; font-weight: 800; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 20px auto; animation: pop 0.5s; }
.main-action-button { width: 100%; max-width: 400px; padding: 16px; background: #3498db; color: white; border: none; border-radius: 14px; font-size: 1.1rem; font-weight: bold; margin-top: 15px; }
.subtitle { margin-top: -15px; color: #7f8c8d; font-weight: bold; }
@keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
</style>
