<template>
  <div class="page-container">
    <TopBar title="Трофеи">
      🏆 {{ progress.unlockedAchievements.length }} / {{ progress.allAchievements.length }}
    </TopBar>

    <div class="achievements-grid">
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
import TopBar from '../components/TopBar.vue';
import { useProgressStore } from '../stores/progress';

const progress = useProgressStore();

const isUnlocked = (id: string) => progress.unlockedAchievements.includes(id);

const sortedAchievements = computed(() => {
  return [...progress.allAchievements].sort((a, b) => {
    const isA = isUnlocked(a.id);
    const isB = isUnlocked(b.id);
    if (isA && !isB) return -1;
    if (!isA && isB) return 1;
    return 0;
  });
});
</script>

<style scoped>
/* Стили для карточек остаются, стили шапки удалены (они в TopBar/main.css) */
.achievements-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
