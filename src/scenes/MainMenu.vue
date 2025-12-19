<template>
  <div class="menu-container">
    <div class="content">

      <div class="profile-card">
        <div class="profile-header">

          <div class="mascot-wrapper">
            <div class="mascot-emoji">{{ progress.currentCharacter!.emoji }}</div>
            <div class="lvl-badge">{{ progress.currentLevel }} ур.</div>
          </div>

          <div class="profile-info">
            <div class="rank-title">{{ progress.currentCharacter!.title }}</div>
            <div class="total-score">Решено задач: {{ progress.totalSolved }}</div>
          </div>
        </div>

        <div class="xp-bar-container">
          <div class="xp-bar-track">
            <div class="xp-bar-fill" :style="{ width: progress.levelProgress + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="buttons-stack">
        <button class="mode-card multiply" @click="nav.navigate('multiplication')">
          <div class="card-icon">×</div>
          <div class="card-info">
            <h2>Умножение</h2>
            <span>Таблица от 1 до 10</span>
          </div>
        </button>

        <button class="mode-card division" @click="nav.navigate('division')">
          <div class="card-icon">÷</div>
          <div class="card-info">
            <h2>Деление</h2>
            <span>Обратное умножение</span>
          </div>
        </button>

        <button class="mode-card plusminus" @click="nav.navigate('sumsub')">
          <div class="card-icon">+/-</div>
          <div class="card-info">
            <h2>Сложение</h2>
            <span>Счет до 50</span>
          </div>
        </button>

        <button class="mode-card achievements-btn" @click="nav.navigate('achievements')">
          <div class="card-icon">🏆</div>
          <div class="card-info">
            <h2>Трофеи</h2>
            <span>Твои награды</span>
          </div>
        </button>

        <button class="mode-card stats-btn" @click="nav.navigate('stats')">
          <div class="card-icon">📊</div>
          <div class="card-info">
            <h2>Прогресс</h2>
            <span>Таблица успехов</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNavigationStore } from '../stores/navigation';
import { useProgressStore } from '../stores/progress';

const nav = useNavigationStore();
const progress = useProgressStore();
</script>

<style scoped>
.menu-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f4f6f8;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
}

.content {
  width: 100%;
  max-width: 400px;
}

/* --- ПРОФИЛЬ --- */
.profile-card {
  background: white;
  padding: 20px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  margin-bottom: 25px;
  border: 1px solid rgba(0,0,0,0.02);
  position: relative;
  overflow: hidden;
}

.profile-card::before {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 140px; height: 140px;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border-radius: 50%;
  z-index: 0;
  opacity: 0.6;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;
  position: relative;
  z-index: 1;
}

.mascot-wrapper {
  position: relative;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mascot-emoji {
  font-size: 55px;
  line-height: 1;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 5px 5px rgba(0,0,0,0.1));
}

.lvl-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #2c3e50;
  color: white;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 12px;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
}

.profile-info { display: flex; flex-direction: column; }
.rank-title { font-size: 1.4rem; font-weight: 800; color: #2c3e50; margin-bottom: 4px; line-height: 1.2; }
.total-score { font-size: 0.9rem; color: #7f8c8d; font-weight: 500; }

/* XP Bar */
.xp-bar-container { width: 100%; position: relative; z-index: 1; }
.xp-bar-track { height: 10px; background: #f0f2f5; border-radius: 5px; overflow: hidden; }
.xp-bar-fill { height: 100%; background: linear-gradient(90deg, #2ecc71, #27ae60); border-radius: 5px; transition: width 0.6s ease; }

/* --- КНОПКИ --- */
.buttons-stack { display: flex; flex-direction: column; gap: 15px; }
.mode-card { display: flex; align-items: center; background: white; border: none; padding: 16px; border-radius: 20px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.03); text-align: left; width: 100%; position: relative; overflow: hidden; }
.mode-card:active { transform: scale(0.98); }
.card-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white; margin-right: 15px; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
.multiply .card-icon { background: linear-gradient(135deg, #3498db, #2980b9); }
.plusminus .card-icon { background: linear-gradient(135deg, #9b59b6, #8e44ad); }
.division .card-icon { background: linear-gradient(135deg, #e67e22, #d35400); }
.achievements-btn .card-icon { background: linear-gradient(135deg, #f1c40f, #f39c12); }
.stats-btn .card-icon { background: #27ae60; }
.card-info h2 { margin: 0; font-size: 1.15rem; color: #2c3e50; font-weight: 700; }
.card-info span { color: #95a5a6; font-size: 0.85rem; font-weight: 500; }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
</style>
