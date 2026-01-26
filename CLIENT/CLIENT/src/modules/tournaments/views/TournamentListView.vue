<template>
  <section class="page">
    <header class="pageHeader">
      <div>
        <h1 class="pageTitle">Tournaments</h1>
        <p class="pageSubtitle">All available tournaments. Filter quickly by status.</p>
      </div>

      <div class="pageHeader__actions">
        <UiSegmented v-model="filter" :options="filterOptions" aria-label="Tournament filter" />

        <UiButton variant="subtle" :disabled="loading" @click="load">
          {{ loading ? 'Loading…' : 'Refresh' }}
        </UiButton>
      </div>
    </header>

    <div v-if="loading" class="cardSection">
      <UiStateCard variant="loading" :lines="4"/>
      <UiStateCard variant="loading" :lines="4"/>

    </div>

    <UiStateCard v-else-if="error" variant="error" title="Error" :message="error">
      <template #action>
        <UiButton @click="load">Retry</UiButton>
      </template>
    </UiStateCard>

    <UiStateCard
      v-else-if="!filteredTournaments.length"
      variant="empty"
      title="No tournaments found."
      :message="emptyHint"
    />

    <div v-else class="list">
      <UiCard
        v-for="t in filteredTournaments"
        :key="t.id"
        as="article"
        size="full"
        density="lg"
        :interactive="true"
      >
        <template #title>
          {{ t.name }} Tournament
        </template>

        <template #titleRight>
          <UiPill>{{ tournamentBadge(t) }}</UiPill>
        </template>

        <template #left>
          <div class="tournamentLeftMeta">
            <div>🗓 Date: {{ formatDateTime(tournamentDate(t)) }}</div>
            <div>🏟️ Location: {{ locationNameById(tournamentLocationId(t)) }}</div>
          </div>
        </template>

        <!-- RIGHT -->
        <template #right>
          <div class="tournamentRightMeta">
            
          </div>
        </template>
      </UiCard>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLookups } from '@/composables/useLookups';
import { fetchTournaments } from '@/api/tournamentsApi';

// UI (dacă nu sunt auto-înregistrate global în proiectul tău)
import UiButton from '@/components/ui/UiButton.vue';
import UiSegmented from '@/components/ui/UiSegmented.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiPill from '@/components/ui/UiPill.vue';

const router = useRouter();

const loading = ref(false);
const error = ref(null);
const tournaments = ref([]);

/**
 * Filter: by status
 *  scheduled | running | finished
 */
const filter = ref('all');
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Running', value: 'running' },
  { label: 'Finished', value: 'finished' },
];

const { warmupLookups, locationNameById } = useLookups();

const emptyHint = computed(() => {
  if (filter.value === 'scheduled') return 'No scheduled tournaments yet.';
  if (filter.value === 'running') return 'No running tournaments right now.';
  if (filter.value === 'finished') return 'No finished tournaments yet.';
  return 'No tournaments available yet.';
});

async function load() {
  loading.value = true;
  error.value = null;

  try {
    const data = await fetchTournaments();
    // backend poate întoarce { data: [...] } sau direct [...]
    tournaments.value = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Failed to load tournaments.';
  } finally {
    loading.value = false;
  }
}

/**
 * Minimal helpers 
*/
function tournamentLocationId(t) {
  return t?.locationId || '';
}

function tournamentDate(t) {
  return t?.startDate || t?.createdAt || null;
}

function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString();
}

function tournamentBadge(t) {
  const s = String(t?.status || '').toLowerCase();
  if (s === 'running') return 'Running';
  if (s === 'finished') return 'Finished';
  if (s === 'scheduled') return 'Scheduled';
  if (s === 'draft') return 'Draft';
  return '—';
}

function courtLabel() {
  return '—';
}
function participantCountLabel() {
  return '—';
}

const filteredTournaments = computed(() => {
  const list = Array.isArray(tournaments.value) ? [...tournaments.value] : [];

  const filtered =
    filter.value === 'all'
      ? list
      : list.filter((t) => String(t?.status || '').toLowerCase() === filter.value);

  return filtered.sort((a, b) => {
    const da = new Date(tournamentDate(a) || 0).getTime();
    const db = new Date(tournamentDate(b) || 0).getTime();
    return db - da;
  });
});

function openDetails(t) {
  
}

onMounted(async () => {
  await warmupLookups();
  await load();
});
</script>