import { defineStore } from 'pinia';
import { ref } from 'vue';

export type Scene = 'menu' | 'multiplication' | 'sumsub' | 'division' | 'stats';

export const useNavigationStore = defineStore('navigation', () => {
  const currentScene = ref<Scene>('menu');

  // Переход с записью в историю
  const navigate = (scene: Scene) => {
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
    navigate,
    goBack,
    initHistory,
    cleanupHistory
  };
});
