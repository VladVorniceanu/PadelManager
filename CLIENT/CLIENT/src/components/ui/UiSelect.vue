<template>
  <select
    class="select"
    :value="modelValue"
    :disabled="disabled"
    v-bind="$attrs"
    @change="onChange"
  >
    <slot />
  </select>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);
function onChange(e) {
  emit('update:modelValue', e?.target?.value ?? '');
}
</script>

<style scoped src="./UiSelect.css"></style>
