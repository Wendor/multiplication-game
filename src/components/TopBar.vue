<template>
  <div class="top-bar">
    <button class="back-btn" @click="nav.goBack()">←</button>
    <h1 class="page-title">{{ title }}</h1>

    <div class="header-stats" v-if="$slots.default">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNavigationStore } from '../stores/navigation';

defineProps<{
  title: string;
}>();

const nav = useNavigationStore();
</script>

