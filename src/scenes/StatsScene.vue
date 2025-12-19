<template>
  <div class="stats-container">
    <TopBar title="Прогресс" />

    <div class="controls">
      <div class="segmented-control">
        <button
          :class="{ active: mode === 'multiplication' }"
          @click="mode = 'multiplication'"
        >
          Умножение
        </button>
        <button
          :class="{ active: mode === 'division' }"
          @click="mode = 'division'"
        >
          Деление
        </button>
        <button
          :class="{ active: mode === 'sumsub' }"
          @click="mode = 'sumsub'"
        >
          Сложение
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
import TopBar from '../components/TopBar.vue';
import { useProgressStore } from '../stores/progress';

const progress = useProgressStore();

type StatMode = 'multiplication' | 'division' | 'sumsub';
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
  } else if (mode.value === 'division') {
    const dividend = row * col;
    const divisor = row;
    return progress.getDivisionStat(dividend, divisor);
  } else {
    return progress.getSumSubStat(row, col);
  }
};

const getCellClass = (row: number, col: number) => {
  const stat = getStatData(row, col);
  const total = stat.c + stat.w;

  if (total === 0) return 'empty';
  if (stat.w > 0) return 'error';
  if (stat.c >= 20) return 'diamond';
  if (stat.c >= 5) return 'mastered';
  return 'novice';
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
  } else if (mode.value === 'division') {
    title = `${row * col} : ${row} = ${col}`;
  } else {
    title = `${row} + ${col} = ${row + col}`;
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
  /* Используем глобальные стили, но можно переопределить */
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 10px;
  background-color: #f4f6f8;
  min-height: 100vh;
  color: #333;
}

/* Переключатель */
.controls { margin-bottom: 20px; }
/* Сетка (Оставляем локально, так как специфично для этого экрана) */
.grid-wrapper {
  background: white;
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  overflow-x: auto;
}

.header-row { display: flex; margin-bottom: 5px; }
.corner-cell { width: 30px; flex-shrink: 0; }
.header-cell { flex: 1; text-align: center; font-weight: bold; color: #95a5a6; font-size: 0.8rem; }

.grid-row { display: flex; align-items: center; margin-bottom: 4px; }
.row-header { width: 30px; text-align: center; font-weight: bold; color: #95a5a6; font-size: 0.8rem; flex-shrink: 0; }

.stat-cell {
  flex: 1; aspect-ratio: 1; margin: 0 2px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: transform 0.1s;
}
.stat-cell:active { transform: scale(0.9); }

.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.diamond-icon { font-size: 10px; animation: pulse 2s infinite; }

/* Цвета градаций */
.stat-cell.empty { background: #f0f2f5; } .stat-cell.empty .status-dot { background: #dcdde1; }
.stat-cell.error { background: #fadbd8; } .stat-cell.error .status-dot { background: #e74c3c; }
.stat-cell.novice { background: #fef9e7; } .stat-cell.novice .status-dot { background: #f1c40f; }
.stat-cell.mastered { background: #d4efdf; } .stat-cell.mastered .status-dot { background: #27ae60; }
.stat-cell.diamond { background: #d6eaf8; border: 1px solid #aed6f1; } .stat-cell.diamond .status-dot { display: none; }

/* Легенда */
.legend { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; align-items: center; padding-bottom: 20px; }
.legend-row { display: flex; gap: 15px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #7f8c8d; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.gray { background: #dcdde1; } .dot.red { background: #e74c3c; }
.dot.yellow { background: #f1c40f; } .dot.green { background: #27ae60; }
.diamond-legend { font-size: 12px; }

/* Модалка */
.modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
.modal-card { background: white; padding: 25px; border-radius: 20px; width: 80%; max-width: 300px; text-align: center; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.modal-card h3 { margin: 0 0 10px 0; font-size: 1.5rem; color: #2c3e50; }

.rank-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.9rem; margin-bottom: 20px; }
.text-red { background: #fadbd8; color: #c0392b; }
.text-yellow { background: #fcf3cf; color: #f39c12; }
.text-green { background: #d4efdf; color: #27ae60; }
.text-blue { background: #d6eaf8; color: #2980b9; }
.text-gray { background: #f0f2f5; color: #7f8c8d; }

.stats-info { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.stat-row { display: flex; justify-content: space-between; padding: 10px; border-radius: 10px; font-weight: 500; }
.stat-row.green { background: #d4efdf; color: #27ae60; }
.stat-row.red { background: #fadbd8; color: #e74c3c; }

.close-btn { background: #34495e; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; width: 100%; }

@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
</style>
