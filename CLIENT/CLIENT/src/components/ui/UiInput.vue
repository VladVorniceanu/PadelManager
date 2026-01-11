<template>
  <input
    class="input"
    :class="{ small: size === 'small' }"
    :type="type"
    :value="valueAttr"
    :placeholder="placeholder"
    :disabled="disabled"
    v-bind="$attrs"
    @input="onInput"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number, null], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'md' }, // md | small
  number: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const valueAttr = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return '';
  return String(props.modelValue);
});

function onInput(e) {
  const raw = e?.target?.value ?? '';
  if (props.number || props.type === 'number') {
    if (raw === '') return emit('update:modelValue', null);
    const n = Number(raw);
    return emit('update:modelValue', Number.isNaN(n) ? null : n);
  }
  emit('update:modelValue', raw);
}
</script>

<style scoped src="./UiInput.css"></style>
