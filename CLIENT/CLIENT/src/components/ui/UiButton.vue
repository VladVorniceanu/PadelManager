<template>
  <button
    class="btn"
    :class="variantClass"
    :type="type"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'default' }, // default | primary | subtle | danger
  type: { type: String, default: 'button' },
});

const variantClass = computed(() => {
  const v = String(props.variant || 'default').toLowerCase();
  if (v === 'default') return null;
  if (v === 'primary') return 'primary';
  if (v === 'subtle') return 'subtle';
  if (v === 'danger') return 'danger';
  return null;
});
</script>

<style scoped src="./UiButton.css"></style>
