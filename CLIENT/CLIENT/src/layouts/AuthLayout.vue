<template>
  <div class="auth-layout">
    <div class="auth-card">
      <h1 class="title">Padel Manager</h1>
      <router-view />
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  min-width: 320px;
}

.title {
  margin-bottom: 1rem;
}
</style>