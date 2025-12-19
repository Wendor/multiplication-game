<template>
  <div class="test-area-container">
    <div v-if="!finished" class="content-wrapper">

      <div class="progress-wrapper">
        <div class="progress-text">
          Вопрос <span>{{ currentIndex + 1 }}</span> из {{ total }}
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" :style="{ width: ((currentIndex) / total) * 100 + '%' }"></div>
        </div>
      </div>

      <div class="question-card" v-if="question">
        <div class="question-text">
          {{ question.text }} = <span class="q-mark">?</span>
        </div>

        <div class="visualizer-slot-wrapper">
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
      <h2>Финиш!</h2>
      <div class="final-score-circle">
        {{ score }} / {{ total }}
      </div>
      <p v-if="score > highScore" class="new-record">🏆 Новый рекорд!</p>
      <p v-else-if="score === total" class="perfect-score">Идеально! ⭐</p>
      <p v-else class="encouragement">Молодец!</p>

      <button @click="$emit('restart')" class="main-action-button">Ещё раз</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  question: {
    text: string;
    correctAnswer: number;
    options: number[];
  } | undefined;
  currentIndex: number;
  total: number;
  score: number;
  highScore: number;
  finished: boolean;
}>();

const emit = defineEmits<{
  (e: 'answer', isCorrect: boolean): void;
  (e: 'next'): void;
  (e: 'restart'): void;
}>();

const isAnswered = ref(false);
const selectedOption = ref<number | null>(null);

watch(() => props.question, () => {
  isAnswered.value = false;
  selectedOption.value = null;
});

const handleAnswerClick = async (option: number) => {
  if (isAnswered.value || !props.question) return;

  isAnswered.value = true;
  selectedOption.value = option;

  const isCorrect = option === props.question.correctAnswer;
  emit('answer', isCorrect);
  await new Promise(resolve => setTimeout(resolve, 1000));
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
.test-area-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center; /* Центрируем всё по горизонтали */
}

.content-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-wrapper {
  margin-bottom: 25px;
  padding: 0 5px;
  width: 100%;
  max-width: 400px; /* Ограничиваем ширину */
}

.progress-text {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #7f8c8d;
  margin-bottom: 10px;
}
.progress-text span { color: #2c3e50; font-weight: 800; font-size: 1.2rem; }

.progress-bar-track {
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #5dade2);
  border-radius: 6px;
  transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.question-card {
  width: 100%;
  max-width: 400px; /* Ограничиваем ширину карточки, чтобы она была по центру */
  background: white;
  border-radius: 20px;
  padding: 20px 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box; /* Важно! */
}

.question-text {
  /* Уменьшили минимальный шрифт с 2.5rem до 2rem */
  font-size: clamp(2rem, 9vw, 3.5rem);
  font-weight: 800;
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.2;
  /* Убрали nowrap, чтобы длинные примеры не ломали верстку */
  word-break: break-word;
}

.q-mark { color: #3498db; }

.visualizer-slot-wrapper { width: 100%; margin-bottom: 20px; }

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  gap: 12px;
}

.option-button {
  width: 100%;
  min-height: 65px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 14px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
  transition: all 0.2s ease;
  padding: 5px; /* Чтобы текст внутри не прилипал к краям */
}
.option-button:active { background: #f0f0f0; transform: scale(0.98); }

/* Классы подсветки */
.btn-correct { background-color: #2ecc71 !important; color: white !important; border-color: #27ae60 !important; transform: scale(1.02); }
.btn-wrong { background-color: #e74c3c !important; color: white !important; border-color: #c0392b !important; animation: shake 0.4s; }
.btn-dimmed { opacity: 0.4; pointer-events: none; }

.results { text-align: center; padding: 10px; width: 100%; }
.final-score-circle {
  width: 110px; height: 110px; background: #2ecc71; color: white;
  font-size: 2.2rem; font-weight: 800; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 20px auto; animation: pop 0.5s;
}
.main-action-button {
  width: 100%; max-width: 400px; /* Тоже ограничиваем кнопку */
  padding: 16px; background: #3498db; color: white; border: none;
  border-radius: 14px; font-size: 1.1rem; font-weight: bold; margin-top: 15px;
}

@keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
</style>
