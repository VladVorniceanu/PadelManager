<template>
  <button class="btn" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup>
</script>

<style scoped>
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid #111827;
  background: #111827;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>