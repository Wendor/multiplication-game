<template>
  <div class="menu-container">
    <div class="content">
      <div class="header">
        <img src="/pwa-192x192.png" alt="Логотип" class="app-logo" />
        <h1>Математика</h1>
        <p>Выбери режим игры</p>
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
const nav = useNavigationStore();
</script>

<style scoped>
/* ... все стили без изменений ... */
.menu-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: #f4f6f8; }
.content { width: 100%; max-width: 400px; text-align: center; }
.app-logo { width: 140px; height: 140px; margin-bottom: 15px; border-radius: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: bounce 2s infinite ease-in-out; }
h1 { margin: 0; color: #2c3e50; font-size: 2.2rem; margin-bottom: 5px; }
p { color: #7f8c8d; margin-bottom: 30px; font-size: 1.1rem; }
.buttons-stack { display: flex; flex-direction: column; gap: 15px; }
.mode-card { display: flex; align-items: center; background: white; border: none; padding: 20px; border-radius: 20px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: left; width: 100%; }
.mode-card:active { transform: scale(0.96); }
.card-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; color: white; margin-right: 15px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.multiply .card-icon { background: linear-gradient(135deg, #3498db, #2980b9); }
.plusminus .card-icon { background: linear-gradient(135deg, #9b59b6, #8e44ad); }
.division .card-icon { background: linear-gradient(135deg, #e67e22, #d35400); }
.stats-btn .card-icon { background: #27ae60; }
.card-info h2 { margin: 0; font-size: 1.3rem; color: #2c3e50; font-weight: 700; }
.card-info span { color: #95a5a6; font-size: 0.9rem; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
</style>
