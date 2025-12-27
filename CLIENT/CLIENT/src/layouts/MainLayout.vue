<template>
  <div class="page">
    <AppToolbar @toggle-drawer="drawerOpen = true">
      <template #title>Padel Manager</template>
    </AppToolbar>

    <SideDrawer :open="drawerOpen" @close="drawerOpen = false" />

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AppToolbar from '../components/common/AppToolbar.vue';
import SideDrawer from '../components/common/SideDrawer.vue';

const drawerOpen = ref(false);
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
}

.content {
  padding: 16px;
}
</style>