<template>
  <div class="menu-container">
    <div class="content">
      <div class="header">
        <div class="mascot">🎓</div>
        <h1>Математика</h1>
        <p>Выбери режим игры</p>
      </div>

      <div class="buttons-stack">
        <button class="mode-card multiply" @click="select('multiplication')">
          <div class="card-icon">×</div>
          <div class="card-info">
            <h2>Умножение</h2>
            <span>Таблица от 1 до 10</span>
          </div>
        </button>

        <button class="mode-card plusminus" @click="select('sumsub')">
          <div class="card-icon">+/-</div>
          <div class="card-info">
            <h2>Сложение</h2>
            <span>Счет до 20 и выше</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Определяем события, чтобы TypeScript не ругался
const emit = defineEmits(['select-mode']);

// Костыль для App.vue: там мы слушаем @go-home, но MainMenu особенный.
// Чтобы не усложнять App.vue, мы будем менять родительский ref напрямую
// ИЛИ (лучше) сделаем так:
// В App.vue изменим: <MainMenu @select-mode="(mode) => currentScene = mode" />
// Но так как там <component :is>, нужно передавать пропсы/эмиты динамически.
// ПРОСТОЙ ВАРИАНТ: Используем $parent или inject. Но это не clean code.
// CLEAN CODE ВАРИАНТ: В App.vue добавим обработчик.

const select = (mode: string) => {
  // Мы просто эмитим событие родителю
  // В App.vue нужно будет добавить слушатель @select-mode
  // См. обновление App.vue ниже.
  emit('select-mode', mode);
};
</script>

<style scoped>
.menu-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f4f6f8;
}

.content {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.mascot { font-size: 80px; margin-bottom: 10px; animation: bounce 2s infinite; }

h1 { margin: 0; color: #2c3e50; font-size: 2.5rem; }
p { color: #7f8c8d; margin-bottom: 40px; }

.buttons-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mode-card {
  display: flex;
  align-items: center;
  background: white;
  border: none;
  padding: 20px;
  border-radius: 24px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  text-align: left;
}

.mode-card:active { transform: scale(0.96); }

.card-icon {
  width: 60px; height: 60px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; font-weight: bold; color: white;
  margin-right: 20px;
  flex-shrink: 0;
}

.multiply .card-icon { background: #3498db; }
.plusminus .card-icon { background: #9b59b6; }

.card-info h2 { margin: 0; font-size: 1.5rem; color: #2c3e50; }
.card-info span { color: #95a5a6; font-size: 0.9rem; }

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
