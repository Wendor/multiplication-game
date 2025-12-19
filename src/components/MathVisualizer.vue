<template>
  <div class="visualizer-root" :class="{ 'is-mini': isMini }">

    <div v-if="type === 'multiplication'" class="viz-container">
      <div v-if="!isMini" class="col-header">
        <span class="color-b">{{ b }} шт. в ряду</span>
        <div class="bracket-hor"></div>
      </div>
      <div class="row-wrapper">
        <div v-if="!isMini" class="row-header">
          <span class="color-a">{{ a }} {{ getRowWord(a) }}</span>
          <div class="bracket-vert"></div>
        </div>

        <div class="dots-grid" :style="{ gridTemplateColumns: `repeat(${b}, 1fr)` }">
          <div
            v-for="n in (a * b)"
            :key="n"
            class="dot"
            :class="isMini ? 'mini-dot' : 'learning-dot'"
            :style="{ animationDelay: `${n * 0.02}s` }"
          ></div>
        </div>
      </div>
    </div>

    <div v-else-if="type === 'division'" class="viz-container">
      <div class="division-groups">
        <div v-for="g in (a / b)" :key="g" class="dot-group">
          <div v-for="d in b" :key="d" class="dot" :class="isMini ? 'mini-dot' : 'learning-dot'"></div>
        </div>
      </div>
    </div>

    <div v-else-if="type === 'sumsub'" class="viz-container sum-row">

      <template v-if="op === 'plus'">
        <div class="dot-group no-border">
          <div v-for="n in a" :key="'a'+n" class="dot dot-a" :class="isMini ? 'mini-dot' : 'learning-dot'"></div>
        </div>
        <div class="plus-sign" :class="{ 'mini-sign': isMini }">+</div>
        <div class="dot-group no-border">
          <div v-for="n in b" :key="'b'+n" class="dot dot-b" :class="isMini ? 'mini-dot' : 'learning-dot'"></div>
        </div>
      </template>

      <template v-else>
        <div class="dot-group no-border">
          <div v-for="n in (a - b)" :key="'rem'+n" class="dot dot-a" :class="isMini ? 'mini-dot' : 'learning-dot'"></div>
        </div>
        <div class="dot-group no-border faded">
          <div v-for="n in b" :key="'sub'+n" class="dot dot-sub" :class="isMini ? 'mini-dot' : 'learning-dot'"></div>
        </div>
      </template>

    </div>

  </div>
</template>

<script setup lang="ts">
defineProps<{
  type: 'multiplication' | 'division' | 'sumsub';
  a: number;
  b: number;
  op?: 'plus' | 'minus';
  isMini?: boolean;
}>();

const getRowWord = (num: number) => {
  const lastDigit = num % 10;
  if (num > 10 && num < 20) return 'рядов';
  if (lastDigit === 1) return 'ряд';
  if (lastDigit >= 2 && lastDigit <= 4) return 'ряда';
  return 'рядов';
};
</script>

<style scoped>
/* Общие стили */
.visualizer-root { display: flex; justify-content: center; width: 100%; }
.viz-container { display: flex; flex-direction: column; align-items: center; }

/* Точки */
.dot { border-radius: 50%; animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards; flex-shrink: 0; }
.learning-dot { width: 16px; height: 16px; background: var(--red); } /* Дефолтный цвет (для умножения) */
.mini-dot { width: 10px; height: 10px; }

/* УМНОЖЕНИЕ */
.col-header { text-align: center; font-weight: bold; color: #555; margin-bottom: 5px; display: flex; flex-direction: column; align-items: center; }
.bracket-hor { width: 100%; height: 8px; border-bottom: 2px solid #ccc; border-left: 2px solid #ccc; border-right: 2px solid #ccc; }
.row-wrapper { display: flex; align-items: center; gap: 8px; }
.row-header { display: flex; align-items: center; font-weight: bold; color: #555; white-space: nowrap; }
.bracket-vert { height: 100%; width: 8px; border-right: 2px solid #ccc; border-top: 2px solid #ccc; border-bottom: 2px solid #ccc; margin-left: 5px; }
.dots-grid { display: grid; gap: 6px; justify-content: center; }
/* В мини режиме для умножения точки синие */
.is-mini .mini-dot { background: var(--accent-color); box-shadow: inset 0 -1px 0 rgba(0,0,0,0.1); }

/* ДЕЛЕНИЕ */
.division-groups { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; max-width: 300px; }
.dot-group { display: flex; gap: 3px; padding: 4px; border: 1px dashed #ccc; border-radius: 8px; background: #fff; }
/* В делении точки синие по умолчанию */
.division-groups .learning-dot, .division-groups .mini-dot { background: var(--accent-color); }

/* СЛОЖЕНИЕ / ВЫЧИТАНИЕ */
.sum-row { flex-direction: row; gap: 10px; flex-wrap: wrap; justify-content: center; }
.dot-group.no-border { border: none; background: transparent; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
.plus-sign { font-size: 2rem; font-weight: bold; color: #ccc; line-height: 1; }
.plus-sign.mini-sign { font-size: 1.2rem; }

/* Цвета точек для сложения */
.dot-a { background: var(--accent-color); }
.dot-b { background: var(--red); }
.dot-sub { background: #bdc3c7; opacity: 0.5; border: 1px dashed #95a5a6; }
.faded { opacity: 0.7; }

@keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
