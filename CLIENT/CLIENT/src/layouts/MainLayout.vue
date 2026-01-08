<template>
  <div class="layout">
    <AppToolbar @toggle-drawer="drawerOpen = true">
      <template #title>Padel Manager</template>

      <template #right>
        <button class="btn primary" type="button" @click="openBookMatch">
          Book a match
        </button>
      </template>
    </AppToolbar>

    <SideDrawer :open="drawerOpen" @close="drawerOpen = false" />

    <main class="content">
      <router-view />
      <router-view name="modal" />
    </main>

    <!-- Global modal mounted once -->
    <BookMatchModal />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AppToolbar from '../components/common/AppToolbar.vue';
import SideDrawer from '../components/common/SideDrawer.vue';

import BookMatchModal from '../modules/matches/components/BookMatchModal.vue';
import { useBookMatchModalStore } from '../modules/matches/store/useBookMatchModalStore';

const drawerOpen = ref(false);
const bookMatch = useBookMatchModalStore();

function openBookMatch() {
  bookMatch.openModal();
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.content {
  padding: 20px 24px;
}
@media (max-width: 720px) {
  .content {
    padding: 16px;
  }
}
</style>