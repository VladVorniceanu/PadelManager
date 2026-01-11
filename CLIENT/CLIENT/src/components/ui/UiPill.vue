<template>
  <span class="pill" :class="{ strong }">
    <slot />
  </span>
</template>

<script setup>
defineProps({ strong: { type: Boolean, default: false } });
</script>

<style scoped src="./UiPill.css"></style>
