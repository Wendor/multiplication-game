<template>
  <div class="stats-container">
    <div class="top-bar">
      <button class="back-btn" @click="nav.goBack()">←</button>
      <div class="title-group">
        <h1>Твой прогресс</h1>
        <p class="subtitle">Таблица умножения</p>
      </div>
    </div>

    <div class="grid-scroll-area">
      <div class="pythagoras-grid">
        <div class="grid-row header-row">
          <div class="cell corner-cell">×</div>
          <div v-for="col in 10" :key="'h'+col" class="cell header-cell">{{ col }}</div>
        </div>

        <div v-for="row in 10" :key="'r'+row" class="grid-row">
          <div class="cell header-cell row-header">{{ row }}</div>

          <div
            v-for="col in 10"
            :key="row+'-'+col"
            class="cell stat-cell"
            :class="getCellClass(row, col)"
            @click="showDetail(row, col)"
          >
            <span v-if="isMastered(row, col)" class="star">★</span>
          </div>
        </div>
      </div>
    </div>

    <div class="legend-card">
      <div class="legend-row">
        <div class="legend-item"><span class="dot grey"></span> Не решал</div>
        <div class="legend-item"><span class="dot yellow"></span> Учу</div>
      </div>
      <div class="legend-row">
        <div class="legend-item"><span class="dot green"></span> Знаю</div>
        <div class="legend-item"><span class="dot gold"></span> Мастер ★</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNavigationStore } from '../stores/navigation';
const nav = useNavigationStore();

interface StatData {
  [key: string]: { c: number; w: number };
}

const stats = ref<StatData>({});

onMounted(() => {
  const saved = localStorage.getItem('multiplicationStats');
  if (saved) {
    stats.value = JSON.parse(saved);
  }
});

const getStat = (a: number, b: number) => {
  return stats.value[`${a}x${b}`] || { c: 0, w: 0 };
};

const getCellClass = (r: number, c: number) => {
  const s = getStat(r, c);
  const total = s.c + s.w;

  if (total === 0) return 'empty';

  if (s.c > 10 && s.w === 0) return 'gold';
  if (s.c > 5) return 'green';
  if (s.c > 0) return 'yellow';
  return 'red';
};

const isMastered = (r: number, c: number) => {
  return getCellClass(r, c) === 'gold';
};

const showDetail = (r: number, c: number) => {
  console.log(`${r} x ${c}`);
};
</script>

<style scoped>
* { box-sizing: border-box; }

.stats-container {
  min-height: 100vh;
  padding: 15px;
  display: flex;
  flex-direction: column;
  background-color: #f4f6f8;
}

/* --- Хедер --- */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f4f6f8;
  padding: 10px 0;
  margin: 0 0 20px 0; /* Убираем отрицательные маржины если были */

  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
}

.back-btn {
  background: white;
  border: none;
  width: 44px; height: 44px;
  border-radius: 50%;
  font-size: 22px;
  color: #2c3e50;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  flex-shrink: 0;
}

.title-group {
  display: flex;
  flex-direction: column;
}

.title-group h1 {
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0;
  line-height: 1.1;
}

.subtitle {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin: 2px 0 0 0;
  font-weight: 500;
}

/* --- Сетка --- */
.grid-scroll-area {
  flex-grow: 1;
  width: 100%;
  /* Магия для скролла: */
  overflow-x: auto;
  display: flex;
  /* Важно: НЕ используем justify-content: center здесь, иначе обрежет левый край */
  padding-bottom: 20px;
  /* Убираем стандартный скроллбар для красоты */
  scrollbar-width: none;
}
.grid-scroll-area::-webkit-scrollbar { display: none; }

.pythagoras-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  /* margin: auto позволяет центрировать, если влезает, и выровнять слева, если нет */
  margin: 0 auto;
  min-width: fit-content; /* Чтобы контейнер не сжимался */
  padding: 0 5px; /* Небольшой отступ с краев */
}

.grid-row {
  display: flex;
  gap: 4px;
}

.cell {
  width: 32px; /* Фиксированная ширина */
  height: 32px; /* Фиксированная высота */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 13px;
  font-weight: bold;
  flex-shrink: 0; /* ЗАПРЕТ НА СЖАТИЕ */
  transition: transform 0.1s;
}

/* Стили заголовков (синие) */
.header-cell {
  background-color: #3498db;
  color: white;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
}

.corner-cell {
  background-color: transparent;
  color: #bdc3c7;
  font-size: 16px;
}

/* Стили ячеек данных */
.stat-cell {
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.03);
}
.stat-cell:active { transform: scale(0.9); }

/* Звездочка */
.star {
  font-size: 10px;
  color: white;
  text-shadow: 0 1px 1px rgba(0,0,0,0.3);
}

/* Цвета статусов */
.empty { background-color: #ecf0f1; color: #bdc3c7; }
.yellow { background-color: #f1c40f; color: white; border: none; }
.green { background-color: #2ecc71; color: white; border: none; }
.red { background-color: #e74c3c; color: white; border: none; }
.gold {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  color: white;
  border: 1px solid #e67e22;
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.4);
}

/* --- Легенда --- */
.legend-card {
  background: white;
  padding: 15px;
  border-radius: 16px;
  box-shadow: 0 -2px 15px rgba(0,0,0,0.03);
  margin-top: auto;
  width: 100%;
  max-width: 400px;
  align-self: center; /* Центрируем саму карточку легенды */
}

.legend-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 8px;
}
.legend-row:last-child { margin-bottom: 0; }

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #555;
  min-width: 90px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: block;
}

.dot.grey { background: #ecf0f1; border: 1px solid #ccc; }
.dot.yellow { background: #f1c40f; }
.dot.green { background: #2ecc71; }
.dot.gold { background: linear-gradient(135deg, #f1c40f, #f39c12); }
</style>
