import { defineStore } from 'pinia';
import { ref } from 'vue';

export type Scene = 'menu' | 'multiplication' | 'sumsub' | 'division' | 'stats' | 'achievements';
export type StatsMode = 'multiplication' | 'division' | 'sumsub';

export const useNavigationStore = defineStore('navigation', () => {
  const currentScene = ref<Scene>('menu');
  const statsMode = ref<StatsMode>('multiplication');

  // Переход с записью в историю + возможность задать вкладку статистики
  const navigate = (scene: Scene, mode?: StatsMode) => {
    if (mode) {
      statsMode.value = mode;
    }
    currentScene.value = scene;
    window.history.pushState({ scene }, '', '');
  };

  // Системный "Назад"
  const goBack = () => {
    window.history.back();
  };

  // Синхронизация при нажатии кнопки браузера "Назад"
  const handlePopState = (event: PopStateEvent) => {
    if (event.state && event.state.scene) {
      currentScene.value = event.state.scene;
    } else {
      currentScene.value = 'menu';
    }
  };

  // Инициализация слушателей (вызовем в App.vue)
  const initHistory = () => {
    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ scene: 'menu' }, '', '');
  };

  const cleanupHistory = () => {
    window.removeEventListener('popstate', handlePopState);
  };

  return {
    currentScene,
    statsMode,
    navigate,
    goBack,
    initHistory,
    cleanupHistory
  };
});
