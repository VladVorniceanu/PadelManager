<template>
  <div class="segmented" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      class="segmented__btn"
      :class="{ active: modelValue === opt.value }"
      type="button"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  ariaLabel: { type: String, default: 'Options' },
});
const emit = defineEmits(['update:modelValue']);
</script>

<style scoped src="./UiSegmented.css"></style>
