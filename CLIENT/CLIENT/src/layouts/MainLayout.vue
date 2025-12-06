<template>
  <div class="app-layout">
    <header class="app-header">
      <h1>Padel Manager</h1>
    </header>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
// layout foarte simplu; îl rafinăm mai târziu
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e5e5;
}

.app-main {
  flex: 1;
  padding: 1rem;
}
</style>