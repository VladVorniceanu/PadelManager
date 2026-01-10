<template>
  <button class="iconBtn" :type="type" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'button' },
});
</script>

<style scoped src="./UiIconButton.css"></style>
