<template>
  <select
    class="select"
    :class="[
      size ? `select--${size}` : null,
      shape ? `select--${shape}` : null,
    ]"
    :value="valueAttr"
    :disabled="disabled"
    v-bind="$attrs"
    @change="onChange"
  >
    <slot />
  </select>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'md' }, // sm | md | lg
  shape: { type: String, default: 'rounded' }, // pill | rounded
  number: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const valueAttr = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return '';
  return String(props.modelValue);
});

function onChange(e) {
  const raw = e?.target?.value ?? '';
  if (props.number) {
    if (raw === '') return emit('update:modelValue', null);
    const n = Number(raw);
    return emit('update:modelValue', Number.isNaN(n) ? null : n);
  }
  emit('update:modelValue', raw);
}
</script>

<style scoped src="./UiSelect.css"></style>
