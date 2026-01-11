<template>
  <div>
    <div v-for="n in lines" :key="n" class="skeletonLine"></div>
  </div>
</template>

<script setup>
defineProps({ lines: { type: Number, default: 3 } });
</script>

<style scoped src="./UiSkeletonLines.css"></style>
