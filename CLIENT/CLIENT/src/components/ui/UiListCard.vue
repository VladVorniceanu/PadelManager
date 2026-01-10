<template>
  <component
    :is="as"
    class="listCard"
    :class="variant ? `listCard--${variant}` : null"
    v-bind="$attrs"
    :type="as === 'button' ? (type || 'button') : undefined"
  >
    <div class="listCard__left">
      <slot name="left" />
    </div>

    <div class="listCard__right">
      <slot name="right" />
    </div>
  </component>
</template>

<script setup>
defineProps({
  as: { type: String, default: 'div' }, // div | button | a
  type: { type: String, default: 'button' },
  variant: { type: String, default: '' }, // match | location | etc
});
</script>

<style scoped src="./UiListCard.css"></style>
