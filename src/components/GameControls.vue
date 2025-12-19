<template>
  <div class="controls-area">
    <div class="segmented-control">
      <button :class="{ active: mode === 'learning' }" @click="$emit('update:mode', 'learning')">Учить</button>
      <button :class="{ active: mode === 'test' }" @click="$emit('update:mode', 'test')">Тест</button>
      <button :class="{ active: mode === 'blitz' }" @click="$emit('update:mode', 'blitz')">⚡ Блиц</button>
    </div>

    <button
      v-if="mistakesCount > 0 && mode !== 'mistakes' && mode !== 'learning'"
      class="mistakes-btn"
      @click="$emit('update:mode', 'mistakes')"
    >
      🩹 Исправить ошибки ({{ mistakesCount }})
    </button>

    <div class="difficulty-selector" v-if="showDifficulty">
      <div class="chips-row">
        <button
          v-for="opt in difficultyOptions"
          :key="opt.value"
          class="chip"
          :class="{ active: currentDifficulty === opt.value }"
          @click="$emit('update:currentDifficulty', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface DifficultyOption {
  label: string;
  value: number;
}

defineProps<{
  mode: string;
  mistakesCount: number;
  showDifficulty?: boolean; // Показывать ли чипсы
  currentDifficulty?: number; // Текущее выбранное число
  difficultyOptions?: DifficultyOption[]; // Варианты { label: 'до 10', value: 10 }
}>();

defineEmits(['update:mode', 'update:currentDifficulty']);
</script>

<style scoped>
/* Стили берутся из main.css */
</style>
