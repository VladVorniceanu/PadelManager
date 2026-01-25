<template>
  <section class="wrap">
    <header class="header">
      <div class="headLeft">
        <h2 class="title">Overview</h2>
        <p class="subtitle">Welcome to the admin overview dashboard.</p>
      </div>

      <div class="headRight">
        <UiButton variant="subtle" :disabled="loading" @click="load">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </UiButton>
      </div>
    </header>
    
    <div v-if="loading" class="cardSection">
      <div class="grid">
        <UiStateCard variant="loading" :lines="4"/>
        <UiStateCard variant="loading" :lines="4"/>
        <UiStateCard variant="loading" :lines="3"/>
        <UiStateCard variant="loading" :lines="3"/>
      </div>
      <UiStateCard variant="loading" :lines="3"/>
      <UiStateCard variant="loading" :lines="2"/>
    </div>

    <UiStateCard v-else-if="error" variant="error" title="Error" :message="error">
      <template #action>
        <UiButton @click="load">Retry</UiButton>
      </template>
    </UiStateCard>

    <div v-else class="cardSection">
      <div class="grid">
        <UiCard as="article">
          <template #top>
            <span>Total users</span>
            <UiPill strong>{{ metrics.totalUsers }} Users</UiPill>
          </template>
          
          <template #body>
            <span class="metaItem">👤 Admins: {{ metrics.totalAdmins }}</span>
            <span class="metaItem">👤 Players: {{ metrics.totalPlayers }}</span>
          </template>
        </UiCard>

        <UiCard as="article">
          <template #top>
            <span>Total Matches</span>
            <UiPill>{{ metrics.totalMatches}} Matches</UiPill>
          </template>
          
          <template #body>
            <span class="metaItem">⏳ Ongoing: {{ metrics.totalOngoingMatches }} Matches</span>
            <span class="metaItem">📅 Scheduled: {{ metrics.totalScheduledMatches }} Matches</span>
            <span class="metaItem">✅ Completed: {{ metrics.totalCompletedMatches }} Matches</span>
          </template>
        </UiCard>
        
        <UiCard as="article">
          <template #top>
            <span>Total locations</span>
            <UiPill strong>{{ metrics.totalLocations }} Locations</UiPill>
          </template>
          
          <template #body>
            <span class="metaItem">📍 Courts total: {{ metrics.totalCourts }} courts</span>
            <span class="metaItem">🏟️ Avg / loc: {{ metrics.avgCourtsPerLocation }} courts per location</span>
          </template>
        </UiCard>

        <UiCard as="article">
          <template #top>
            <span>Courts</span>
            <UiPill>{{ metrics.totalCourts }} Courts</UiPill>
          </template>
          
          <template #body>
            <span class="metaItem">💡 Indoor courts: {{ metrics.indoorCourts }}</span>
            <span class="metaItem">🌳 Outdoor courts: {{ metrics.outdoorCourts }}</span>
          </template>
        </UiCard>
      </div>
      <UiCard as="article">
        <template #top>
          <span>Matches by court type</span>
          <UiPill>{{ metrics.totalMatches }} Matches</UiPill>
        </template>
        
        <template #body>
          <span class="metaItem">💡 Indoor matches: {{ metrics.matchesIndoor }}</span>
          <span class="metaItem">🌳 Outdoor matches: {{ metrics.matchesOutdoor }}</span>
        </template>
      </UiCard>
      <UiCard as="article">
        <template #body>
          <div class="timestamps">
            <div>Data source: <span>Server</span></div>
          </div>
          <div class="timestamps" v-if="metrics.latestUpdate">
            <div>Last update: <span>{{ formatDate(metrics.latestUpdate) }}</span></div>
          </div>
        </template>
      </UiCard>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiPill from '@/components/ui/UiPill.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';

import { fetchUsers } from '@/api/usersApi';
import { fetchLocations } from '@/api/locationsApi';
import { auth } from '@/services/firebase';
import { fetchNumberOfMatches, fetchNumberOfMatchesByStatus } from '@/api/matchesApi';
import UiCard from '@/components/ui/UiCard.vue';

const loading = ref(false);
const error = ref(null);

const metrics = reactive({
  totalUsers: 0,
  totalAdmins: 0,
  totalPlayers: 0,

  totalLocations: 0,
  totalCourts: 0,
  avgCourtsPerLocation: '0.0',

  totalMatches: 0,
  totalOngoingMatches: 0,
  totalScheduledMatches: 0,
  totalCompletedMatches: 0,

  locationsWithCourts: 0,
  locationsWithoutCourts: 0,
  
  indoorCourts: 0,
  outdoorCourts: 0,
  matchesIndoor: 0,
  matchesOutdoor: 0,

  latestUpdate: null,
  tokenStatus: 'Guest',
});

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function parseDateLike(val) {
  // serverul poate trimite string ISO (cel mai probabil)
  const d = typeof val === 'string' ? new Date(val) : val instanceof Date ? val : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDate(val) {
  const d = parseDateLike(val);
  return d ? d.toLocaleString() : String(val);
}

async function load() {
  loading.value = true;
  error.value = null;

  try {
    const [usersRaw, locationsRaw] = await Promise.all([
      fetchUsers(),
      fetchLocations(),
    ]);

    const users = safeArray(usersRaw);
    const locations = safeArray(locationsRaw);

    metrics.totalUsers = users.length;
    metrics.totalAdmins = users.filter((u) => u?.role === 'admin').length;
    metrics.totalPlayers = users.filter((u) => (u?.role ?? 'player') === 'player').length;

    metrics.totalLocations = locations.length;

    const courtsTotal = locations.reduce((sum, l) => sum + (l?.courts?.length ?? 0), 0);
    metrics.totalCourts = courtsTotal;

    metrics.avgCourtsPerLocation =
      locations.length > 0 ? (courtsTotal / locations.length).toFixed(0) : '0.0';

    metrics.locationsWithCourts = locations.filter((l) => (l?.courts?.length ?? 0) > 0).length;
    metrics.locationsWithoutCourts = metrics.totalLocations - metrics.locationsWithCourts;

    metrics.indoorCourts = locations.reduce(
      (sum, l) => sum + (l?.courts?.filter((c) => c?.indoor).length ?? 0),
      0,
    );
    metrics.outdoorCourts = courtsTotal - metrics.indoorCourts;

    metrics.totalMatches = await fetchNumberOfMatches();
    metrics.totalOngoingMatches = await fetchNumberOfMatchesByStatus('ongoing');
    metrics.totalScheduledMatches = await fetchNumberOfMatchesByStatus('scheduled');
    metrics.totalCompletedMatches = await fetchNumberOfMatchesByStatus('completed');

    metrics.matchesIndoor = await fetchNumberOfMatchesByStatus('indoor');
    metrics.matchesOutdoor = metrics.totalMatches - metrics.matchesIndoor;

    metrics.latestUpdate = new Date(Date.now());

    metrics.tokenStatus = auth.currentUser ? 'Authenticated' : 'Guest';
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Failed to load overview metrics';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>