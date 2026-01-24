<template>
  <teleport to="body">
    <div class="backdrop" @click.self="emit('close')">
      <div class="modal" v-bind="attrs" :class="modalClass" role="dialog" aria-modal="true">
        <div v-if="hasHeader" class="modalHeader">
          <div>
            <div class="modalTitle">
              <slot name="title">{{ title }}</slot>
            </div>
            <div v-if="subtitle" class="modalSubtitle">
              <slot name="subtitle">{{ subtitle }}</slot>
            </div>
          </div>

          <UiIconButton v-if="showClose" aria-label="Close" @click="emit('close')">✕</UiIconButton>
        </div>

        <div class="modalBody">
          <slot />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, useAttrs } from 'vue';
import UiIconButton from './UiIconButton.vue';

const attrs = useAttrs();

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
  modalClass: { type: [String, Array, Object], default: '' },
});

const emit = defineEmits(['close']);
const hasHeader = computed(() => props.showClose || props.title || props.subtitle);
</script>

<style scoped src="./UiModal.css"></style>
