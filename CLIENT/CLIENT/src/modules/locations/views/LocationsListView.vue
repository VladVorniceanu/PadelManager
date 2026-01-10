<template>
  <section class="page">
    <header class="pageHeader">
      <div>
        <h1 class="pageTitle">Locations</h1>
        <p class="pageSubtitle">Check out all the available locations.</p>
      </div>

      <UiButton variant="subtle" :disabled="loading" @click="load">
        {{ loading ? 'Loading…' : 'Refresh' }}
      </UiButton>
    </header>

    <UiStateCard v-if="loading" variant="loading" :lines="3" >
      <div class="skeletonLine"></div>
      <div class="skeletonLine"></div>
      <div class="skeletonLine"></div>
    </UiStateCard>

    <UiStateCard v-else-if="error" variant="error" title="Error" :message="error">
      <template #action>
        <UiButton @click="load">Retry</UiButton>
      </template>
    </UiStateCard>

    <div v-else-if="!items.length" class="card empty">
      <div class="emptyTitle">No locations available.</div>
      <div class="emptyMsg">Please come back later.</div>
    </div>

    <div v-else class="list">
      <UiListCard
        v-for="l in items"
        :key="l.id"
        type="button"
        as="button" variant="location"
        @click="openDetails(l)"
      >
        <template #left>
          <div class="listCard__titleRow">
            <div class="listCard__title">{{ l.name || '—' }}</div>
            <span class="pill">{{ (l.courts?.length ?? 0) }} courts</span>
          </div>

          <div class="listCard__city">{{ l.city || '—' }}</div>
          <div class="listCard__address">{{ l.address || '—' }}</div>
        </template>

        <template #right>
          <div class="mediaFrame" aria-hidden="true">
            <span class="mediaFrame__hint">Image</span>
          </div>
        </template>
      </UiListCard>
    </div>

    <router-view />
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';
import UiListCard from '@/components/ui/UiListCard.vue';

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
</style>