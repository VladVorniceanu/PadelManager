<template>
  <UiButton class="iconBtn" :type="type" v-bind="$attrs">
    <slot />
  </UiButton>
</template>

<script setup>
defineProps({ type: { type: String, default: 'button' } });
import UiButton from '@/components/ui/UiButton.vue';
</script>

<style scoped src="./UiIconButton.css"></style>
