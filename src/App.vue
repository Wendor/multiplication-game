<template>
  <div class="app-wrapper">
    <AchievementToast />

    <Transition name="fade-scene" mode="out-in">
      <component :is="currentSceneComponent" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useNavigationStore } from './stores/navigation';
import { storeToRefs } from 'pinia';

// Импорт компонент сцен
import MainMenu from './scenes/MainMenu.vue';
import MultiplicationGame from './scenes/MultiplicationGame.vue';
import SumSubGame from './scenes/SumSubGame.vue';
import DivisionGame from './scenes/DivisionGame.vue';
import StatsScene from './scenes/StatsScene.vue';
import AchievementsScene from './scenes/AchievementsScene.vue';

// Импорт Тоста
import AchievementToast from './components/AchievementToast.vue';

const nav = useNavigationStore();
const { currentScene } = storeToRefs(nav);

const currentSceneComponent = computed(() => {
  switch (currentScene.value) {
    case 'multiplication': return MultiplicationGame;
    case 'sumsub': return SumSubGame;
    case 'division': return DivisionGame;
    case 'stats': return StatsScene;
    case 'achievements': return AchievementsScene;
    default: return MainMenu;
  }
});

onMounted(() => nav.initHistory());
onUnmounted(() => nav.cleanupHistory());
</script>

<style>
body {
  margin: 0;
  background-color: #f4f6f8;
  overscroll-behavior: none;
  overflow-x: hidden;
}
</style>
<style scoped>
.app-wrapper { width: 100%; min-height: 100vh; }
.fade-scene-enter-active, .fade-scene-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-scene-enter-from { opacity: 0; transform: scale(0.98); }
.fade-scene-leave-to { opacity: 0; transform: scale(1.02); }
</style>
