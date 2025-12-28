<template>
  <section class="page">
    <header class="pageHeader">
      <div>
        <h1 class="pageTitle">Locations</h1>
        <p class="pageSubtitle">Alege o locație și rezervă rapid un meci.</p>
      </div>

      <button class="btn subtle" :disabled="loading" @click="load">
        {{ loading ? 'Loading…' : 'Refresh' }}
      </button>
    </header>

    <div v-if="loading" class="card">
      <div class="skeletonLine"></div>
      <div class="skeletonLine"></div>
      <div class="skeletonLine"></div>
    </div>

    <div v-else-if="error" class="card error">
      <div class="errorTitle">Eroare</div>
      <div class="errorMsg">{{ error }}</div>
      <button class="btn" @click="load">Retry</button>
    </div>

    <div v-else-if="!items.length" class="card empty">
      <div class="emptyTitle">Nu există locații.</div>
      <div class="emptyMsg">Revino mai târziu.</div>
    </div>

    <div v-else class="list">
      <button
        v-for="l in items"
        :key="l.id"
        type="button"
        class="listCard"
        @click="openDetails(l)"
      >
        <div class="listCard__left">
          <div class="listCard__titleRow">
            <div class="listCard__title">{{ l.name || '—' }}</div>
            <span class="pill">{{ (l.courts?.length ?? 0) }} courts</span>
          </div>

          <div class="listCard__city">{{ l.city || '—' }}</div>
          <div class="listCard__address">{{ l.address || '—' }}</div>
        </div>

        <div class="listCard__right">
          <div class="mediaFrame" aria-hidden="true">
            <span class="mediaFrame__hint">Image</span>
          </div>
        </div>
      </button>
    </div>

    <!-- modal route outlet -->
    <router-view />
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchLocations } from '@/api/locationsApi';

const router = useRouter();

const loading = ref(false);
const error = ref(null);
const items = ref([]);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    items.value = (await fetchLocations()) ?? [];
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Failed to load locations';
  } finally {
    loading.value = false;
  }
}

function openDetails(loc) {
  router.push({ path: `/locations/${loc.id}` }).catch(() => {});
}

onMounted(load);
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.pageHeader { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.pageTitle { margin: 0; font-size: 22px; font-weight: 950; letter-spacing: -0.02em; }
.pageSubtitle { margin: 6px 0 0; font-size: 13px; color: #6b7280; }

.list { display: flex; flex-direction: column; gap: 12px; }
</style>