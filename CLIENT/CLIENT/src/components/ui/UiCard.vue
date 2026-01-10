<template>
  <div class="card" :class="variantClass">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'default' }, // default | error | empty
});

const variantClass = computed(() => {
  const v = String(props.variant || 'default').toLowerCase();
  if (v === 'error') return 'error';
  if (v === 'empty') return 'empty';
  return null;
});
</script>

<style scoped src="./UiCard.css"></style>
