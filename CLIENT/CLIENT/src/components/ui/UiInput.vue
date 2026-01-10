<template>
  <input
    class="input"
    :class="{ small: size === 'small' }"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    v-bind="$attrs"
    @input="onInput"
  />
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'md' }, // md | small
});

const emit = defineEmits(['update:modelValue']);

function onInput(e) {
  emit('update:modelValue', e?.target?.value ?? '');
}
</script>

<style scoped src="./UiInput.css"></style>
