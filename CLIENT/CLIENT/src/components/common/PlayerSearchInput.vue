<template>
  <div class="playerSearch">
    <div class="playerSearch__row">
      <input
        class="input playerSearch__input"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        v-model="query"
        @focus="open = true"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="pickActive()"
        @keydown.esc.prevent="close()"
      />

      <button
        v-if="modelValue"
        type="button"
        class="btn subtle playerSearch__clear"
        :disabled="disabled"
        @click="clear"
      >
        Clear
      </button>
    </div>

    <div v-if="open" class="playerSearch__panel" @mousedown.prevent>
      <div v-if="loading" class="playerSearch__hint">Searching…</div>

      <template v-else>
        <button
          v-for="(u, idx) in results"
          :key="u.id"
          type="button"
          class="playerSearch__item"
          :class="{ active: idx === activeIndex }"
          @click="select(u)"
        >
          <div class="playerSearch__name">{{ userLabel(u) }}</div>
          <div class="playerSearch__meta">{{ u.email || u.id }}</div>
        </button>

        <div v-if="!results.length" class="playerSearch__hint">
          {{ query.trim().length < minChars ? `Type at least ${minChars} characters…` : 'No users found.' }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useUsersStore } from '@/stores/useUsersStore';

const props = defineProps({
  modelValue: { type: [Object, String, null], default: null }, // {id, displayName,email} or uid
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Search player…' },
  minChars: { type: Number, default: 2 },
});

const emit = defineEmits(['update:modelValue']);

const usersStore = useUsersStore();

const open = ref(false);
const query = ref('');
const loading = ref(false);
const results = ref([]);
const activeIndex = ref(0);

let debounceTimer = null;

const normalizedModel = computed(() => {
  if (!props.modelValue) return null;
  if (typeof props.modelValue === 'string') return { id: props.modelValue, displayName: '', email: '' };
  return props.modelValue;
});

watch(
  () => normalizedModel.value,
  (m) => {
    // if externally set, reflect label in input
    if (!m) {
      query.value = '';
      return;
    }
    query.value = m.displayName || m.name || m.email || m.id || '';
  },
  { immediate: true }
);

function userLabel(u) {
  return u.displayName || u.name || u.email || `User ${String(u.id).slice(0, 6)}`;
}

function close() {
  open.value = false;
  activeIndex.value = 0;
}

function clear() {
  emit('update:modelValue', null);
  query.value = '';
  results.value = [];
  close();
}

function select(u) {
  // emit full object (id + displayName/email) ca să poți afișa frumos fără lookup extra
  emit('update:modelValue', { id: u.id, displayName: u.displayName || u.name || '', email: u.email || '' });
  query.value = userLabel(u);
  close();
}

function move(delta) {
  if (!results.value.length) return;
  const next = activeIndex.value + delta;
  if (next < 0) activeIndex.value = results.value.length - 1;
  else if (next >= results.value.length) activeIndex.value = 0;
  else activeIndex.value = next;
}

function pickActive() {
  const u = results.value[activeIndex.value];
  if (u) select(u);
}

async function doSearch() {
  const q = query.value.trim();
  if (props.disabled) return;

  if (q.length < props.minChars) {
    results.value = [];
    loading.value = false;
    activeIndex.value = 0;
    return;
  }

  loading.value = true;
  try {
    const found = await usersStore.search(q, 10);
    const list = Array.isArray(found) ? found : [];

    // cache in store (so lookups work everywhere)
    usersStore.upsertMany(list);

    results.value = list.map((u) => ({
      id: u.id,
      displayName: u.displayName || u.name || '',
      email: u.email || '',
    }));
    activeIndex.value = 0;
  } catch {
    results.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => query.value,
  () => {
    if (!open.value) open.value = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doSearch, 250);
  }
);

function onWindowClick(e) {
  // close when clicking outside
  const root = e.target?.closest?.('.playerSearch');
  if (!root) close();
}

watch(
  () => open.value,
  (v) => {
    if (v) window.addEventListener('click', onWindowClick);
    else window.removeEventListener('click', onWindowClick);
  }
);

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  window.removeEventListener('click', onWindowClick);
});
</script>

<style scoped>
/* minim: restul mută în style.css dacă vrei */
.playerSearch { position: relative; width: 100%; }
.playerSearch__row { display: flex; gap: 8px; align-items: center; }
.playerSearch__input { width: 100%; }
.playerSearch__clear { padding: 10px 10px; }

.playerSearch__panel {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--ui-shadow-soft);
}

.playerSearch__item {
  width: 100%;
  text-align: left;
  border: none;
  background: #fff;
  padding: 10px 12px;
  cursor: pointer;
  display: grid;
  gap: 2px;
}
.playerSearch__item:hover { background: var(--ui-surface-muted); }
.playerSearch__item.active { background: #111827; color: #fff; }
.playerSearch__item.active .playerSearch__meta { color: rgba(255,255,255,.75); }

.playerSearch__name { font-weight: 900; font-size: 13px; }
.playerSearch__meta { font-size: 12px; color: var(--ui-muted); }

.playerSearch__hint {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--ui-muted);
}
</style>