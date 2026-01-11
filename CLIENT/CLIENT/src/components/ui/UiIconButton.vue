<template>
  <UiButton class="iconBtn" :type="type" v-bind="$attrs">
    <slot />
  </UiButton>
</template>

<script setup>
defineProps({ type: { type: String, default: 'button' } });
</script>

<style scoped src="./UiIconButton.css"></style>
