<template>
  <div class="achievements-container">
    <div class="top-bar">
      <button class="back-btn" @click="nav.goBack()">←</button>
      <h1>Трофеи</h1>
      <div class="header-stats">
        🏆 {{ progress.unlockedAchievements.length }} / {{ progress.allAchievements.length }}
      </div>
    </div>

    <div class="grid">
      <div
        v-for="ach in progress.allAchievements"
        :key="ach.id"
        class="achievement-card"
        :class="{ 'locked': !isUnlocked(ach.id) }"
      >
        <div class="icon">{{ isUnlocked(ach.id) ? ach.emoji : '🔒' }}</div>
        <div class="info">
          <h3>{{ ach.title }}</h3>
          <p>{{ ach.description }}</p>
        </div>
        <div class="status-icon" v-if="isUnlocked(ach.id)">✅</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNavigationStore } from '../stores/navigation';
import { useProgressStore } from '../stores/progress';

const nav = useNavigationStore();
const progress = useProgressStore();

const isUnlocked = (id: string) => progress.unlockedAchievements.includes(id);
</script>

<style scoped>
/* Контейнер сцены */
.achievements-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 10px; /* Отступы у контейнера */
  background-color: #f4f6f8;
  min-height: 100vh;
  color: #333;
  box-sizing: border-box;
}

/* ИСПРАВЛЕННАЯ ШАПКА */
.top-bar {
  /* Sticky позиционирование */
  position: sticky;
  top: 0;
  z-index: 100;

  /* Фон */
  background-color: rgba(244, 246, 248, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);

  /* Растягиваем шапку, компенсируя padding: 10px у родителя */
  margin-left: -10px;
  margin-right: -10px;
  margin-top: -10px; /* Прижимаем к самому верху */
  margin-bottom: 15px;

  /* Внутренние отступы шапки */
  padding: 10px 15px;

  /* Важно: width: auto позволяет блоку самому занять ширину с учетом margins */
  width: auto;
  box-sizing: border-box;

  /* Flex */
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  background: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  color: #2c3e50;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  flex-shrink: 0; /* Чтобы кнопка не сжималась */
}

h1 {
  font-size: 1.2rem;
  margin: 0;
  color: #2c3e50;
  flex-grow: 1;
}

.header-stats {
  background: #ffecb3;
  color: #d35400;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  white-space: nowrap;
  flex-shrink: 0; /* ВАЖНО: Запрещаем кубку сжиматься или уезжать */
}

/* Сетка ачивок */
.grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 20px;
}

.achievement-card {
  background: white;
  padding: 15px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.03);
  transition: transform 0.2s;
}

.achievement-card.locked {
  opacity: 0.6;
  filter: grayscale(100%);
  background: #f9f9f9;
}

.icon {
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  border-radius: 50%;
  flex-shrink: 0;
}

.achievement-card:not(.locked) .icon {
  background: #fff8e1;
}

.info {
  flex-grow: 1;
  min-width: 0; /* Важно для переноса текста внутри flex */
}

.info h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.info p {
  margin: 0;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.status-icon {
  font-size: 1.2rem;
}
</style>
