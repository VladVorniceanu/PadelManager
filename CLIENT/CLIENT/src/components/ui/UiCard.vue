<template>
  <component
    :is="as"
    class="uiCard"
    :data-size="size"
    :class="[
      variantClass,
      interactive ? 'uiCard--interactive' : null,
      density ? `uiCard--${density}` : null,
    ]"
    v-bind="$attrs"
    :type="as === 'button' ? (type || 'button') : undefined"
  >
    <div v-if="hasTop" class="uiCard__top">
      <template v-if="$slots.top">
        <slot name="top" />
      </template>
      <template v-else>
        <div class="uiCard__title">
          <slot name="title" />
        </div>
        <div v-if="$slots.titleRight" class="uiCard__titleRight">
          <slot name="titleRight" />
        </div>
      </template>
    </div>

    <div class="uiCard__body" :class="bodyClass">
      <template v-if="hasSplit">
        <div class="uiCard__left"><slot name="left" /></div>
        <div v-if="$slots.right" class="uiCard__right"><slot name="right" /></div>
        <div v-if="$slots.bottom" class="uiCard__bottom"><slot name="bottom" /></div>
      </template>

      <template v-else>
        <slot name="body" />
        <slot />
      </template>
    </div>
  </component>
</template>

<script setup>
import { computed, useSlots } from 'vue';

const slots = useSlots();

const props = defineProps({
  as: { type: String, default: 'div' }, // div | article | button | a
  type: { type: String, default: 'button' }, // only for `as="button"`: button | submit | reset
  variant: { type: String, default: 'default' }, // default | error | empty
  size: { type: String, default: 'full' }, // full | half | compact
  density: { type: String, default: 'md' }, // sm | md | lg
  interactive: { type: Boolean, default: false },
});

const variantClass = computed(() => {
  const v = String(props.variant || 'default').toLowerCase();
  if (v === 'error') return 'uiCard--error';
  if (v === 'empty') return 'uiCard--empty';
  return null;
});

const hasTop = computed(() => Boolean(slots.top || slots.title || slots.titleRight));
const hasSplit = computed(() => Boolean(slots.left || slots.right));
const hasBottom = computed(() => Boolean(slots.bottom));

const bodyClass = computed(() => {
  if (!hasSplit.value) return null;
  if (!slots.right) return 'uiCard__body--single';
  return hasBottom.value ? 'uiCard__body--split uiCard__body--withBottom' : 'uiCard__body--split';
});
</script>

<style scoped src="./UiCard.css"></style>