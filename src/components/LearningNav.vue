<template>
  <div class="number-nav" :class="{ 'compact-nav': compact }">
    <button
      v-for="i in total"
      :key="i"
      class="nav-circle"
      :class="{ active: modelValue === i, small: compact }"
      @click="$emit('update:modelValue', i)"
    >
      <slot name="content" :num="i">
        {{ i }}
      </slot>

      <template v-if="getMedal">
        <div class="medal-icon" :class="{ 'small-medal': compact }" v-if="getMedal(i) === 3">🥇</div>
        <div class="medal-icon" :class="{ 'small-medal': compact }" v-else-if="getMedal(i) === 2">🥈</div>
        <div class="medal-icon" :class="{ 'small-medal': compact }" v-else-if="getMedal(i) === 1">🥉</div>
      </template>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number | 'mix'; // Текущее активное число
  total: number;      // Сколько кружков рисовать (например, 10)
  getMedal?: (num: number) => number; // Функция получения медали
  compact?: boolean; // Режим маленьких кружков (для теста)
}>();

defineEmits(['update:modelValue']);
</script>

<style scoped>
/* Стили из main.css */
</style>
