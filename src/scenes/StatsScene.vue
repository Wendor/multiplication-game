<template>
  <div class="stats-container">
    <div class="top-bar">
      <button class="back-btn" @click="nav.goBack()">←</button>
      <h1>Прогресс</h1>
    </div>

    <div class="controls">
      <div class="segmented-control">
        <button
          :class="{ active: mode === 'multiplication' }"
          @click="mode = 'multiplication'"
        >
          Умножение ×
        </button>
        <button
          :class="{ active: mode === 'division' }"
          @click="mode = 'division'"
        >
          Деление :
        </button>
      </div>
    </div>

    <div class="grid-wrapper">

      <div class="header-row">
        <div class="corner-cell"></div>
        <div v-for="col in 10" :key="col" class="header-cell">{{ col }}</div>
      </div>

      <div v-for="row in 10" :key="row" class="grid-row">
        <div class="row-header">{{ row }}</div>

        <div
          v-for="col in 10"
          :key="col"
          class="stat-cell"
          :class="getCellClass(row, col)"
          @click="showDetails(row, col)"
        >
          <div v-if="getCellClass(row, col) === 'diamond'" class="diamond-icon">💎</div>
          <div v-else class="status-dot"></div>
        </div>
      </div>
    </div>

    <div class="legend">
      <div class="legend-row">
        <div class="legend-item"><div class="dot gray"></div><span>Нет данных</span></div>
        <div class="legend-item"><div class="dot red"></div><span>Ошибка</span></div>
        <div class="legend-item"><div class="dot yellow"></div><span>&lt; 5 раз</span></div>
      </div>
      <div class="legend-row">
        <div class="legend-item"><div class="dot green"></div><span>&gt; 5 раз</span></div>
        <div class="legend-item"><div class="diamond-legend">💎</div><span>Мастер (20+)</span></div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="selectedCell" class="modal-backdrop" @click="selectedCell = null">
        <div class="modal-card" @click.stop>
          <h3>{{ selectedCell.title }}</h3>

          <div class="rank-badge" :class="selectedCell.rankClass">
            {{ selectedCell.rankText }}
          </div>

          <div class="stats-info">
            <div class="stat-row green">
              <span>Решено верно:</span>
              <strong>{{ selectedCell.correct }}</strong>
            </div>
            <div class="stat-row red">
              <span>Ошибок сейчас:</span>
              <strong>{{ selectedCell.wrong }}</strong>
            </div>
          </div>
          <button class="close-btn" @click="selectedCell = null">Закрыть</button>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNavigationStore } from '../stores/navigation';
import { useProgressStore } from '../stores/progress';

const nav = useNavigationStore();
const progress = useProgressStore();

type StatMode = 'multiplication' | 'division';
const mode = ref<StatMode>('multiplication');

const selectedCell = ref<{
  title: string,
  correct: number,
  wrong: number,
  rankText: string,
  rankClass: string
} | null>(null);

const getStatData = (row: number, col: number) => {
  if (mode.value === 'multiplication') {
    return progress.getStat(row, col);
  } else {
    const dividend = row * col;
    const divisor = row;
    return progress.getDivisionStat(dividend, divisor);
  }
};

// --- НОВАЯ ЛОГИКА ГРАДАЦИЙ ---
const getCellClass = (row: number, col: number) => {
  const stat = getStatData(row, col);
  const total = stat.c + stat.w;

  if (total === 0) return 'empty';           // 0. Не решали
  if (stat.w > 0) return 'error';            // 1. Есть активная ошибка (Красный)
  if (stat.c >= 20) return 'diamond';        // 4. Мастер (Алмаз)
  if (stat.c >= 5) return 'mastered';        // 3. Знаток (Зеленый)
  return 'novice';                           // 2. Новичок (Желтый)
};

const getRankInfo = (c: number, w: number) => {
  if (w > 0) return { text: 'Нужно исправить 🩹', class: 'text-red' };
  if (c >= 20) return { text: 'Абсолютный Мастер 💎', class: 'text-blue' };
  if (c >= 5) return { text: 'Знаток 🧠', class: 'text-green' };
  if (c > 0) return { text: 'Новичок 🐣', class: 'text-yellow' };
  return { text: 'Не решено', class: 'text-gray' };
};

const showDetails = (row: number, col: number) => {
  const stat = getStatData(row, col);
  let title = '';

  if (mode.value === 'multiplication') {
    title = `${row} × ${col} = ${row * col}`;
  } else {
    title = `${row * col} : ${row} = ${col}`;
  }

  const rank = getRankInfo(stat.c, stat.w);

  selectedCell.value = {
    title,
    correct: stat.c,
    wrong: stat.w,
    rankText: rank.text,
    rankClass: rank.class
  };
};
</script>

<style scoped>
* { box-sizing: border-box; }

.stats-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 10px;
  background-color: #f4f6f8;
  min-height: 100vh;
  color: #333;
}

/* --- ИСПРАВЛЕННАЯ ШАПКА (КАК ВЕЗДЕ) --- */
.top-bar {
  position: sticky; /* Делаем липкой, как в игре */
  top: 0;
  z-index: 100;
  background-color: rgba(244, 246, 248, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);

  /* Компенсация отступов родителя, чтобы шапка была во всю ширину */
  margin: -10px -10px 15px -10px;
  padding: 10px 15px;
  width: auto;

  display: flex;
  align-items: center;
  gap: 10px; /* Отступ между стрелкой и текстом */
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

  flex-shrink: 0; /* Чтобы кнопка не сплющивалась */
  /* Убрали position: absolute */
}

h1 {
  flex-grow: 1;
  text-align: left; /* Текст слева */
  font-size: 1.2rem; /* Размер как в игре */
  margin: 0;
  color: #2c3e50;
}

/* Переключатель */
.controls {
  margin-bottom: 20px;
}
.segmented-control {
  display: flex;
  background: #e0e0e0;
  padding: 4px;
  border-radius: 12px;
}
.segmented-control button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.2s;
}
.segmented-control button.active {
  background: white;
  color: #333;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Сетка */
.grid-wrapper {
  background: white;
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  overflow-x: auto;
}

.header-row {
  display: flex;
  margin-bottom: 5px;
}
.corner-cell {
  width: 30px;
  flex-shrink: 0;
}
.header-cell {
  flex: 1;
  text-align: center;
  font-weight: bold;
  color: #95a5a6;
  font-size: 0.8rem;
}

.grid-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.row-header {
  width: 30px;
  text-align: center;
  font-weight: bold;
  color: #95a5a6;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.stat-cell {
  flex: 1;
  aspect-ratio: 1;
  margin: 0 2px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s;
}
.stat-cell:active { transform: scale(0.9); }

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.diamond-icon { font-size: 10px; animation: pulse 2s infinite; }

/* Цвета градаций */
.stat-cell.empty { background: #f0f2f5; }
.stat-cell.empty .status-dot { background: #dcdde1; }

.stat-cell.error { background: #fadbd8; }
.stat-cell.error .status-dot { background: #e74c3c; }

.stat-cell.novice { background: #fef9e7; }
.stat-cell.novice .status-dot { background: #f1c40f; }

.stat-cell.mastered { background: #d4efdf; }
.stat-cell.mastered .status-dot { background: #27ae60; }

.stat-cell.diamond { background: #d6eaf8; border: 1px solid #aed6f1; }
.stat-cell.diamond .status-dot { display: none; }

/* Легенда */
.legend {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding-bottom: 20px; /* Отступ снизу */
}
.legend-row { display: flex; gap: 15px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #7f8c8d; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.gray { background: #dcdde1; }
.dot.red { background: #e74c3c; }
.dot.yellow { background: #f1c40f; }
.dot.green { background: #27ae60; }
.diamond-legend { font-size: 12px; }

/* Модалка */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}
.modal-card {
  background: white;
  padding: 25px;
  border-radius: 20px;
  width: 80%;
  max-width: 300px;
  text-align: center;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-card h3 {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.rank-badge {
  display: inline-block; padding: 4px 12px; border-radius: 12px;
  font-weight: bold; font-size: 0.9rem; margin-bottom: 20px;
}
.text-red { background: #fadbd8; color: #c0392b; }
.text-yellow { background: #fcf3cf; color: #f39c12; }
.text-green { background: #d4efdf; color: #27ae60; }
.text-blue { background: #d6eaf8; color: #2980b9; }
.text-gray { background: #f0f2f5; color: #7f8c8d; }

.stats-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-radius: 10px;
  font-weight: 500;
}
.stat-row.green { background: #d4efdf; color: #27ae60; }
.stat-row.red { background: #fadbd8; color: #e74c3c; }

.close-btn {
  background: #34495e;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
}

@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
