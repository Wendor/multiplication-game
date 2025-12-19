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
        v-for="ach in sortedAchievements"
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
import { computed } from 'vue';
import { useNavigationStore } from '../stores/navigation';
import { useProgressStore } from '../stores/progress';

const nav = useNavigationStore();
const progress = useProgressStore();

const isUnlocked = (id: string) => progress.unlockedAchievements.includes(id);

// Сортировка: Сначала полученные, потом закрытые
const sortedAchievements = computed(() => {
  // Создаем копию массива, чтобы не мутировать исходный порядок в сторе
  return [...progress.allAchievements].sort((a, b) => {
    const isA = isUnlocked(a.id);
    const isB = isUnlocked(b.id);

    // Если A открыта, а B нет — A идет выше (-1)
    if (isA && !isB) return -1;
    // Если B открыта, а A нет — B идет выше (1)
    if (!isA && isB) return 1;
    // Иначе оставляем порядок как был (по id/порядку в массиве)
    return 0;
  });
});
</script>

<style scoped>
/* Глобальный box-sizing для надежности */
* {
  box-sizing: border-box;
}

.achievements-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  /* Убираем паддинг у контейнера, чтобы шапка прилипала */
  padding: 0;
  background-color: #f4f6f8;
  min-height: 100vh;
  color: #333;
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(244, 246, 248, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);

  padding: 10px 15px;
  width: 100%;

  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  background: white; border: none; width: 40px; height: 40px; border-radius: 50%;
  font-size: 20px; color: #2c3e50; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

h1 { font-size: 1.2rem; margin: 0; color: #2c3e50; flex-grow: 1; }
.header-stats {
  background: #ffecb3; color: #d35400;
  padding: 4px 12px; border-radius: 20px;
  font-weight: bold; font-size: 0.9rem; white-space: nowrap;
  flex-shrink: 0;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* Паддинги перенесли сюда */
  padding: 10px 15px 20px 15px;
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
  min-width: 0;
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
