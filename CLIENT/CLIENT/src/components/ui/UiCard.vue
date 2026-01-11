<template>
  <component :is="as" class="card" :class="variantClass">
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  as: { type: String, default: 'div' },
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
