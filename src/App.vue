<template>
  <div class="app-wrapper">
    <Transition name="fade-scene" mode="out-in">
      <component
        :is="currentSceneComponent"
        @go-home="currentScene = 'menu'"
        @select-mode="(mode: Scene) => currentScene = mode"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
// Обновленные пути импорта
import MainMenu from './scenes/MainMenu.vue';
import MultiplicationGame from './scenes/MultiplicationGame.vue';
import SumSubGame from './scenes/SumSubGame.vue';

type Scene = 'menu' | 'multiplication' | 'sumsub';

const currentScene = ref<Scene>('menu');

const currentSceneComponent = computed(() => {
  switch (currentScene.value) {
    case 'multiplication': return MultiplicationGame;
    case 'sumsub': return SumSubGame;
    default: return MainMenu;
  }
});
</script>

<style>
body { margin: 0; background-color: #f4f6f8; overscroll-behavior: none; }
</style>

<style scoped>
.app-wrapper { width: 100%; min-height: 100vh; }
.fade-scene-enter-active, .fade-scene-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-scene-enter-from { opacity: 0; transform: scale(0.98); }
.fade-scene-leave-to { opacity: 0; transform: scale(1.02); }
</style>
