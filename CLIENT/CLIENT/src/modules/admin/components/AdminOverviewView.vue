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

    <UiStateCard v-if="loading" variant="loading" :lines="3" />

    <UiStateCard v-else-if="error" variant="error" title="Eroare" :message="error">
      <template #action>
        <UiButton @click="load">Retry</UiButton>
      </template>
    </UiStateCard>

    <div v-else class="grid">
      <article class="locCard">
        <div class="locHead">
          <div class="locIdentity">
            <div class="locNameRow">
              <div class="locName">Total users</div>
              <UiPill strong>{{ metrics.totalUsers }}</UiPill>
            </div>
            <div class="locMeta">
              <span class="metaItem">👤 Admins: {{ metrics.totalAdmins }}</span>
              <span class="dot">•</span>
              <span class="metaItem">Players: {{ metrics.totalPlayers }}</span>
            </div>
          </div>
        </div>

        <div class="locBody">
          <div class="timestamps">
            <div>Source: <span>Server</span></div>
          </div>
        </div>
      </article>

      <article class="locCard">
        <div class="locHead">
          <div class="locIdentity">
            <div class="locNameRow">
              <div class="locName">Total locations</div>
              <UiPill strong>{{ metrics.totalLocations }}</UiPill>
            </div>
            <div class="locMeta">
              <span class="metaItem">📍 Courts total: {{ metrics.totalCourts }}</span>
              <span class="dot">•</span>
              <span class="metaItem">Avg/loc: {{ metrics.avgCourtsPerLocation }}</span>
            </div>
          </div>
        </div>

        <div class="locBody">
          <div class="timestamps" v-if="metrics.latestLocationUpdate">
            <div>Last update: <span>{{ formatDate(metrics.latestLocationUpdate) }}</span></div>
          </div>
          <div class="timestamps" v-else>
            <div>Source: <span>Server</span></div>
          </div>
        </div>
      </article>

      <article class="locCard">
        <div class="locHead">
          <div class="locIdentity">
            <div class="locNameRow">
              <div class="locName">Security</div>
              <UiPill>{{ metrics.tokenStatus }}</UiPill>
            </div>
            <div class="locMeta">
              <span class="metaItem">🔒 Auth: Bearer token via Axios interceptor</span>
            </div>
          </div>
        </div>

        <div class="locBody">
          <div class="timestamps">
            <div>Note: <span>counts computed client-side</span></div>
          </div>
        </div>
      </article>

      <article class="locCard">
        <div class="locHead">
          <div class="locIdentity">
            <div class="locNameRow">
              <div class="locName">Courts distribution</div>
              <UiPill>{{ metrics.locationsWithCourts }} / {{ metrics.totalLocations }}</UiPill>
            </div>
            <div class="locMeta">
              <span class="metaItem">🏟️ Locations with ≥1 court</span>
            </div>
          </div>
        </div>

        <div class="locBody">
          <div class="timestamps">
            <div>Empty locations: <span>{{ metrics.locationsWithoutCourts }}</span></div>
          </div>
        </div>
      </article>
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

const loading = ref(false);
const error = ref(null);

const metrics = reactive({
  totalUsers: 0,
  totalAdmins: 0,
  totalPlayers: 0,

  totalLocations: 0,
  totalCourts: 0,
  avgCourtsPerLocation: '0.0',
  latestLocationUpdate: null,

  locationsWithCourts: 0,
  locationsWithoutCourts: 0,

  tokenStatus: 'guest',
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
      locations.length > 0 ? (courtsTotal / locations.length).toFixed(1) : '0.0';

    metrics.locationsWithCourts = locations.filter((l) => (l?.courts?.length ?? 0) > 0).length;
    metrics.locationsWithoutCourts = metrics.totalLocations - metrics.locationsWithCourts;

    // latest update timestamp from locations
    const allDates = locations
      .map((l) => parseDateLike(l?.updatedAt) || parseDateLike(l?.createdAt))
      .filter(Boolean);

    metrics.latestLocationUpdate = allDates.length
      ? new Date(Math.max(...allDates.map((d) => d.getTime()))).toISOString()
      : null;

    metrics.tokenStatus = auth.currentUser ? 'authenticated' : 'guest';
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Failed to load overview metrics';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>