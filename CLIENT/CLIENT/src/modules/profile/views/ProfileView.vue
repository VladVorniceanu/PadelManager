<template>
  <section class="profile">
    <header class="profile__header">
      <div>
        <h1 class="profile__title">My Profile</h1>
        <p class="profile__subtitle">
          Statistici personale generate din meciurile tale (inclusiv turnee).
        </p>
      </div>

      <div class="profile__actions">
        <button class="btn" :disabled="loading" @click="load">
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

    <div v-else class="profile__grid">
      <!-- Primary stats -->
      <article class="statCard">
        <div class="statCard__label">Games played</div>
        <div class="statCard__value">{{ stats.gamesPlayed ?? 0 }}</div>
        <div class="statCard__meta">Total meciuri în care ai fost participant.</div>
      </article>

      <article class="statCard">
        <div class="statCard__label">Wins</div>
        <div class="statCard__value">{{ stats.wins ?? 0 }}</div>
        <div class="statCard__meta">Doar meciuri finalizate.</div>
      </article>

      <article class="statCard">
        <div class="statCard__label">Losses</div>
        <div class="statCard__value">{{ stats.losses ?? 0 }}</div>
        <div class="statCard__meta">Doar meciuri finalizate.</div>
      </article>

      <article class="statCard">
        <div class="statCard__label">Win rate</div>
        <div class="statCard__value">{{ winRate }}</div>
        <div class="statCard__meta">Raport wins / (wins + losses).</div>
      </article>

      <!-- Secondary stats -->
      <article class="statCard wide">
        <div class="statCard__label">Most frequent teammate</div>
        <div class="statCard__value statCard__value--sm">
          {{ formatTopUser(stats.mostFrequentTeammate) }}
        </div>
        <div class="statCard__meta">Bazat pe meciuri în care ați fost în aceeași echipă.</div>
      </article>

      <article class="statCard wide">
        <div class="statCard__label">Most frequent opponent</div>
        <div class="statCard__value statCard__value--sm">
          {{ formatTopUser(stats.mostFrequentOpponent) }}
        </div>
        <div class="statCard__meta">Bazat pe meciuri în care ați fost în echipe opuse.</div>
      </article>

      <article class="statCard wide">
        <div class="statCard__label">Most played location</div>
        <div class="statCard__value statCard__value--sm">
          {{ formatTopLocation(stats.mostPlayedLocation) }}
        </div>
        <div class="statCard__meta">Locația în care ai jucat cel mai des.</div>
      </article>

      <!-- Raw (debug) -->
      <details class="card details">
        <summary>Raw payload</summary>
        <pre class="json">{{ prettyStats }}</pre>
      </details>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { httpClient } from '../../../api/httpClient';
import { fetchLocations } from '../../../api/locationsApi';

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

// small cache for location name previews
const locationsById = ref(new Map());

const winRate = computed(() => {
  const w = Number(stats.value?.wins ?? 0);
  const l = Number(stats.value?.losses ?? 0);
  const total = w + l;
  if (!total) return '—';
  const pct = Math.round((w / total) * 100);
  return `${pct}%`;
});

const prettyStats = computed(() => {
  try {
    return JSON.stringify(stats.value, null, 2);
  } catch {
    return String(stats.value);
  }
});

async function loadLocationsOnce() {
  // We load public locations to show a nicer preview than a raw locationId.
  // If the endpoint is protected and fails, we just ignore.
  if (locationsById.value.size) return;
  try {
    const items = await fetchLocations();
    const map = new Map();
    for (const l of items || []) {
      map.set(l.id, l);
    }
    locationsById.value = map;
  } catch {
    // ignore
  }
}

async function load() {
  loading.value = true;
  error.value = null;

  try {
    // Stats endpoint (auth required)
    const res = await httpClient.get('/stats/me');
    stats.value = res?.data?.data ?? stats.value;

    // best effort for nicer location label
    await loadLocationsOnce();
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Nu am putut încărca statisticile.';
  } finally {
    loading.value = false;
  }
}

function formatTopUser(top) {
  if (!top) return '—';
  const key = top.key || top.uid || top.id;
  const count = top.count ?? 0;
  return key ? `${key} (${count})` : '—';
}

function formatTopLocation(top) {
  if (!top) return '—';
  const locationId = top.key || top.locationId;
  const count = top.count ?? 0;

  const loc = locationId ? locationsById.value.get(locationId) : null;
  if (loc) {
    const label = `${loc.name || '—'}${loc.city ? ` — ${loc.city}` : ''}`;
    return `${label} (${count})`;
  }

  return locationId ? `${locationId} (${count})` : '—';
}

onMounted(load);
</script>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.profile__title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.profile__subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.profile__actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.profile__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 900px) {
  .profile__grid {
    grid-template-columns: 1fr;
  }
}

.statCard {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 16px;
  padding: 14px;
}

.statCard.wide {
  grid-column: 1 / -1;
}

.statCard__label {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.statCard__value {
  font-size: 28px;
  font-weight: 950;
  margin-top: 6px;
  letter-spacing: -0.02em;
}

.statCard__value--sm {
  font-size: 16px;
  font-weight: 900;
}

.statCard__meta {
  margin-top: 8px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  background: #fff;
}

.card.error {
  border-color: #fecaca;
  background: #fff5f5;
}

.errorTitle {
  font-weight: 900;
  margin-bottom: 6px;
}

.errorMsg {
  color: #7f1d1d;
  margin-bottom: 12px;
}

.btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 14px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 700;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.skeletonLine {
  height: 14px;
  background: #f3f4f6;
  border-radius: 10px;
  margin: 10px 0;
}

.details {
  grid-column: 1 / -1;
}

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