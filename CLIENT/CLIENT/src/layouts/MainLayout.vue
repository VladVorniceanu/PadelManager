<template>
  <div class="layout">
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
/* layout-ul NU setează width / centrare.
   Asta e responsabilitatea “shell”-ului global din style.css */
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

/* un singur container de conținut, cu padding constant */
.content {
  padding: 20px 24px;
}
@media (max-width: 720px) {
  .content {
    padding: 16px;
  }
}
</style>