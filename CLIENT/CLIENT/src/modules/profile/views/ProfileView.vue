<template>
  <section class="page">
    <header class="pageHeader">
      <div>
        <h1 class="pageTitle">My Profile</h1>
        <p class="pageSubtitle">Personal statistics and insights about your matches.</p>
      </div>

      <div class="pageHeader__actions">
        <button class="btn subtle" :disabled="loading" @click="load">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>
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

    <div v-else class="statsGrid">
      <!-- Primary stats -->
      <article class="card statCard">
        <div class="statCard__label">Games played</div>
        <div class="statCard__value">{{ stats.gamesPlayed }}</div>
        <div class="statCard__meta">Total matches you have participated in.</div>
      </article>

      <article class="card statCard">
        <div class="statCard__label">Wins</div>
        <div class="statCard__value">{{ stats.wins }}</div>
        <div class="statCard__meta">Only finalised matches.</div>
      </article>

      <article class="card statCard">
        <div class="statCard__label">Losses</div>
        <div class="statCard__value">{{ stats.losses }}</div>
        <div class="statCard__meta">Only finalised matches.</div>
      </article>

      <article class="card statCard">
        <div class="statCard__label">Win rate</div>
        <div class="statCard__value">{{ winRate }}</div>
        <div class="statCard__meta">Wins / (Wins + Losses).</div>
      </article>

      <!-- Secondary stats -->
      <article class="card statCard statCard--wide">
        <div class="statCard__label">Most frequent teammate</div>
        <div class="statCard__value statCard__value--sm">
          {{ formatTopUser(stats.mostFrequentTeammate) }}
        </div>
        <div class="statCard__meta">Based on matches where you were on the same team.</div>
      </article>

      <article class="card statCard statCard--wide">
        <div class="statCard__label">Most frequent opponent</div>
        <div class="statCard__value statCard__value--sm">
          {{ formatTopUser(stats.mostFrequentOpponent) }}
        </div>
        <div class="statCard__meta">Based on matches where you were on opposing teams.</div>
      </article>

      <article class="card statCard statCard--wide">
        <div class="statCard__label">Most played location</div>
        <div class="statCard__value statCard__value--sm">
          {{ formatTopLocation(stats.mostPlayedLocation) }}
        </div>
        <div class="statCard__meta">Location where you played the most.</div>
      </article>

      <!-- Raw (debug) -->
      <details class="card statsDebug">
        <summary>Raw payload</summary>
        <pre class="json">{{ prettyStats }}</pre>
      </details>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { httpClient } from '@/api/httpClient';
import { useLookups } from '@/composables/useLookups';

// Lookups shared (users + locations)
const { userDisplayNameById, warmupLookups, locationNameById } = useLookups();

const loading = ref(false);
const error = ref(null);

const stats = ref({
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  mostFrequentTeammate: null,
  mostFrequentOpponent: null,
  mostPlayedLocation: null,
});

const winRate = computed(() => {
  const w = Number(stats.value?.wins ?? 0);
  const l = Number(stats.value?.losses ?? 0);
  const total = w + l;
  if (!total) return '—';
  return `${Math.round((w / total) * 100)}%`;
});

const prettyStats = computed(() => {
  try { return JSON.stringify(stats.value, null, 2); }
  catch { return String(stats.value); }
});

/**
 * Normalize helpers: accept either string id or { key, count }
 */
function normalizeTopKey(v) {
  if (!v) return { key: null, count: 0 };
  if (typeof v === 'string') return { key: v, count: 0 };
  return {
    key: v.key || v.uid || v.id || v.userId || v.locationId || null,
    count: Number(v.count ?? 0) || 0,
  };
}

function formatTopUser(v) {
  const { key, count } = normalizeTopKey(v);
  if (!key) return '—';
  const label = userDisplayNameById?.(key) || `User ${String(key).slice(0, 6)}`;
  if (count === 1) {
    return `${label} — ${count} match`;
  } else {
    return `${label} — ${count} matches`;
  }
}

function formatTopLocation(v) {
  const { key, count } = normalizeTopKey(v);
  if (!key) return '—';
  const label = locationNameById?.(key) || `Location ${String(key).slice(0, 6)}`;
    if (count === 1) {
    return `${label} — ${count} match`;
  } else {
    return `${label} — ${count} matches`;
  }
}

async function load() {
  loading.value = true;
  error.value = null;

  try {
    // load stats
    const res = await httpClient.get('/stats/me');
    stats.value = res?.data?.data ?? res?.data ?? stats.value;

  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Could not load profile stats.';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await warmupLookups();
  load();
});
</script>

<style scoped>
.statsDebug { grid-column: 1 / -1; }

.json {
  margin: 10px 0 0;
  padding: 12px;
  background: #0b1220;
  color: #e5e7eb;
  border-radius: 12px;
  overflow: auto;
  font-size: 12px;
}
</style>