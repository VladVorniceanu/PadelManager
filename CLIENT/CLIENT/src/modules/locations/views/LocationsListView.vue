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

    <UiStateCard v-if="loading" variant="loading" :lines="3" />

    <UiStateCard v-else-if="error" variant="error" title="Error" :message="error">
      <template #action>
        <UiButton @click="load">Retry</UiButton>
      </template>
    </UiStateCard>

    <UiStateCard
      v-else-if="!items.length"
      variant="empty"
      title="No locations available."
      message="Please come back later."
    />

    <div v-else class="list">
      <UiCard
        v-for="l in items"
        :key="l.id"
        as="button"
        type="button"
        size="full"
        density="lg"
        :interactive="true"
        @click="openDetails(l)"
        >
        <template #title>
          {{ l.name || '—' }}
        </template>

        <template #titleRight>
          <UiPill>{{ (l.courts?.length ?? 0) }} courts</UiPill>
        </template>

        <template #left>
          <div class="listCard__city">{{ l.city || '—' }}</div>
          <div class="listCard__address">{{ l.address || '—' }}</div>
        </template>

        <template #right>
        </template>
      </UiCard>
    </div>
    <router-view />
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';
import UiPill from '@/components/ui/UiPill.vue';

import { useRouter } from 'vue-router';
import { fetchLocations } from '@/api/locationsApi';
import UiCard from '@/components/ui/UiCard.vue';

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