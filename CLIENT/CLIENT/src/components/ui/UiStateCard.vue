<template>
  <UiCard :variant="cardVariant">
    <template v-if="variant === 'loading'">
      <UiSkeletonLines :lines="lines" />
    </template>

    <template v-else-if="variant === 'error'">
      <div class="errorTitle">{{ title || 'Error' }}</div>
      <div class="errorMsg">{{ message }}</div>
      <div v-if="$slots.action" style="margin-top: 10px;">
        <slot name="action" />
      </div>
    </template>

    <template v-else-if="variant === 'empty'">
      <div class="emptyTitle">{{ title || 'Nothing here' }}</div>
      <div class="emptyMsg">{{ message }}</div>
      <div v-if="$slots.action" style="margin-top: 10px;">
        <slot name="action" />
      </div>
    </template>

    <template v-else>
      <slot />
    </template>
  </UiCard>
</template>

<script setup>
import { computed } from 'vue';
import UiCard from './UiCard.vue';
import UiSkeletonLines from './UiSkeletonLines.vue';

const props = defineProps({
  variant: { type: String, default: 'default' }, // default | loading | error | empty
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  lines: { type: Number, default: 3 },
});

const cardVariant = computed(() => {
  if (props.variant === 'error') return 'error';
  if (props.variant === 'empty') return 'empty';
  return 'default';
});
</script>

<style scoped src="./UiStateCard.css"></style>
