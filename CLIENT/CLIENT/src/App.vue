<template>
  <router-view v-if="isGuestOnlyRoute" />
  <MainLayout v-else />
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MainLayout from './layouts/MainLayout.vue';

const route = useRoute();
const isGuestOnlyRoute = computed(() => {
  if (route.meta?.guestOnly) return true;

  const name = String(route.name || '');
  if (name === 'login' || name === 'register') return true;

  const path = String(route.path || '');
  return path.startsWith('/login') || path.startsWith('/register');
});
</script>