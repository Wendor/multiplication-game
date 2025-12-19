<template>
  <Transition name="toast-slide">
    <div v-if="progress.toastVisible && progress.currentToastAchievement" class="toast-wrapper">
      <div class="toast-card">
        <div class="toast-icon">
          {{ progress.currentToastAchievement.emoji }}
        </div>
        <div class="toast-content">
          <div class="toast-label">🏆 Достижение получено!</div>
          <div class="toast-title">{{ progress.currentToastAchievement.title }}</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useProgressStore } from '../stores/progress';

const progress = useProgressStore();
</script>

<style scoped>
.toast-wrapper {
  position: fixed;
  top: 20px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 9999; /* Поверх всего */
  pointer-events: none; /* Чтобы клики проходили сквозь пустые места */
}

.toast-card {
  background: white;
  padding: 12px 20px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
  pointer-events: auto;
  min-width: 280px;
}

.toast-icon {
  width: 44px;
  height: 44px;
  background: #fff8e1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.toast-content {
  display: flex;
  flex-direction: column;
}

.toast-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: #f39c12;
}

.toast-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #2c3e50;
  line-height: 1.2;
}

/* Анимация появления */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); /* Пружинистый эффект */
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-50px) scale(0.9);
}
</style>
