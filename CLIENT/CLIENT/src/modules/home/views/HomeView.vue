<template>
  <section class="home">
    <!-- Top row -->
    <header class="home__hero">
      <div class="home__heroLeft">
        <h1 class="home__title">
          Welcome, <span class="home__name">{{ displayName }}</span>
        </h1>
        <p class="home__subtitle">
          Quick overview of what’s happening in your Padel Manager account.
        </p>
      </div>

    </header>

    <!-- Sections -->
    <div class="home__sections">
      <!-- Future matches -->
      <section class="homeSection">
        <div class="homeSection__head">
          <h2 class="homeSection__title">Your future matches</h2>
          <button class="btn subtle" @click="goMatches">View all</button>
        </div>

        <div v-if="loadingMatches" class="card">
          <div class="skeletonLine"></div>
          <div class="skeletonLine"></div>
        </div>

        <div v-else-if="futureMatches.length === 0" class="card empty">
          <div class="emptyTitle">No upcoming matches.</div>
          <div class="emptyMsg">Create one and invite players.</div>
        </div>

        <div v-else class="grid3">
          <article v-for="m in futureMatches" :key="m.id" class="itemCard">
            <div class="itemCard__top">
              <div class="itemCard__title">{{ matchTitle(m) }}</div>
              <span class="pill">{{ matchStatus(m) }}</span>
            </div>
            <div class="itemCard__meta">
              <div>🗓 {{ formatDateTime(matchDate(m)) }}</div>
              <div v-if="matchLocationLabel(m)">📍 {{ matchLocationLabel(m) }}</div>
            </div>
          </article>
        </div>
      </section>

      <!-- Recent matches -->
      <section class="homeSection">
        <div class="homeSection__head">
          <h2 class="homeSection__title">Recent matches</h2>
          <button class="btn subtle" @click="goMatches">View all</button>
        </div>

        <div v-if="loadingMatches" class="card">
          <div class="skeletonLine"></div>
          <div class="skeletonLine"></div>
        </div>

        <div v-else-if="recentMatches.length === 0" class="card empty">
          <div class="emptyTitle">No recent matches.</div>
          <div class="emptyMsg">Play a match to see history here.</div>
        </div>

        <div v-else class="grid3">
          <article v-for="m in recentMatches" :key="m.id" class="itemCard">
            <div class="itemCard__top">
              <div class="itemCard__title">{{ matchTitle(m) }}</div>
              <span class="pill">{{ matchStatus(m) }}</span>
            </div>
            <div class="itemCard__meta">
              <div>🗓 {{ formatDateTime(matchDate(m)) }}</div>
              <div v-if="matchLocationLabel(m)">📍 {{ matchLocationLabel(m) }}</div>
            </div>
          </article>
        </div>
      </section>

      <!-- Locations nearby -->
      <section class="homeSection">
        <div class="homeSection__head">
          <h2 class="homeSection__title">Locations</h2>

          <div class="homeSection__actions">
            <button class="btn subtle" @click="requestGeo" :disabled="geoBusy">
              {{ geoBusy ? 'Locating…' : geoEnabled ? 'Location enabled' : 'Use my location' }}
            </button>
            <button class="btn subtle" @click="goLocations">View all</button>
          </div>
        </div>

        <div v-if="loadingLocations" class="card">
          <div class="skeletonLine"></div>
          <div class="skeletonLine"></div>
        </div>

        <div v-else-if="nearbyLocations.length === 0" class="card empty">
          <div class="emptyTitle">No locations to show.</div>
          <div class="emptyMsg">
            {{ geoEnabled ? 'No locations found within 20km (or missing coordinates).' : 'Enable location to see nearby results.' }}
          </div>
        </div>

        <div v-else class="grid3">
          <article v-for="l in nearbyLocations" :key="l.id" class="itemCard">
            <div class="itemCard__top">
              <div class="itemCard__title">{{ l.name || '—' }}</div>
              <span class="pill">{{ (l.courts?.length ?? 0) }} courts</span>
            </div>
            <div class="itemCard__meta">
              <div>📍 {{ [l.city, l.address].filter(Boolean).join(' — ') || '—' }}</div>
              <div v-if="l.__distanceKm != null">📏 {{ l.__distanceKm.toFixed(1) }} km</div>
            </div>
          </article>
        </div>
      </section>

      <!-- Available tournaments -->
      <section class="homeSection">
        <div class="homeSection__head">
          <h2 class="homeSection__title">Available tournaments</h2>
          <button class="btn subtle" @click="goTournaments">View all</button>
        </div>

        <div v-if="loadingTournaments" class="card">
          <div class="skeletonLine"></div>
          <div class="skeletonLine"></div>
        </div>

        <div v-else-if="availableTournaments.length === 0" class="card empty">
          <div class="emptyTitle">No tournaments available.</div>
          <div class="emptyMsg">Check back later.</div>
        </div>

        <div v-else class="grid3">
          <article v-for="t in availableTournaments" :key="t.id" class="itemCard">
            <div class="itemCard__top">
              <div class="itemCard__title">{{ t.name || '—' }}</div>
              <span class="pill">{{ statusLabel(t.status) }}</span>
            </div>
            <div class="itemCard__meta">
              <div>🗓 {{ formatDate(t.startDate) }} → {{ formatDate(t.endDate) }}</div>
              <div v-if="locationNameById(t.locationId)">📍 {{ locationNameById(t.locationId) }}</div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../../../services/firebase';
import { httpClient } from '../../../api/httpClient';
import { fetchLocations } from '../../../api/locationsApi';
import { useBookMatchModalStore } from '../../matches/store/useBookMatchModalStore';

const router = useRouter();

const loadingMatches = ref(false);
const loadingTournaments = ref(false);
const loadingLocations = ref(false);

const matches = ref([]);
const tournaments = ref([]);
const locations = ref([]);

const geoBusy = ref(false);
const geoEnabled = ref(false);
const userPos = ref(null); // { lat, lng }
const bookMatch = useBookMatchModalStore();

const displayName = computed(() => {
  const u = auth.currentUser;
  return u?.displayName || u?.email || 'player';
});

/**
 * Routing helpers
 */
function goBookMatch() {
  bookMatch.openModal();
}

function goMatches() {
  router.push({ name: 'friendly-list' }).catch(() => {});
}
function goLocations() {
  router.push({ name: 'locations-list' }).catch(() => {});
}
function goTournaments() {
  router.push({ name: 'tournaments-list' }).catch(() => {});
}

/**
 * Loaders (fără API-uri noi pe server)
 * - matches: GET /matches
 * - tournaments: GET /tournaments
 * - locations: folosim locationsApi existent
 */
async function loadMatches() {
  loadingMatches.value = true;
  try {
    const res = await httpClient.get('/matches');
    matches.value = res?.data?.data ?? res?.data ?? [];
  } catch {
    matches.value = [];
  } finally {
    loadingMatches.value = false;
  }
}

async function loadTournaments() {
  loadingTournaments.value = true;
  try {
    const res = await httpClient.get('/tournaments');
    tournaments.value = res?.data?.data ?? res?.data ?? [];
  } catch {
    tournaments.value = [];
  } finally {
    loadingTournaments.value = false;
  }
}

async function loadLocations() {
  loadingLocations.value = true;
  try {
    const items = await fetchLocations();
    locations.value = items ?? [];
  } catch {
    locations.value = [];
  } finally {
    loadingLocations.value = false;
  }
}

/**
 * Filtering logic (best-effort, ca să nu depindem 100% de schema exactă)
 */
const myUid = computed(() => auth.currentUser?.uid);

function matchParticipants(m) {
  // încearcă mai multe forme posibile
  if (Array.isArray(m?.participants)) return m.participants;
  if (Array.isArray(m?.playerIds)) return m.playerIds;
  const teams = m?.teams;
  if (Array.isArray(teams)) {
    return teams.flatMap((t) => t?.players ?? []);
  }
  if (teams?.team1 || teams?.team2) {
    const t1 = teams.team1?.players ?? [];
    const t2 = teams.team2?.players ?? [];
    return [...t1, ...t2];
  }
  return [];
}

function isMyMatch(m) {
  const uid = myUid.value;
  if (!uid) return false;
  if (m?.createdBy === uid) return true;
  const list = matchParticipants(m);
  return list.includes(uid);
}

function matchDate(m) {
  return m?.scheduledAt || m?.startTime || m?.date || m?.createdAt || null;
}

function isFuture(m) {
  const d = new Date(matchDate(m));
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > Date.now();
}

function isPast(m) {
  const d = new Date(matchDate(m));
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() <= Date.now();
}

const myMatches = computed(() => (matches.value || []).filter(isMyMatch));

const futureMatches = computed(() =>
  [...myMatches.value]
    .filter(isFuture)
    .sort((a, b) => new Date(matchDate(a)) - new Date(matchDate(b)))
    .slice(0, 3)
);

const recentMatches = computed(() =>
  [...myMatches.value]
    .filter(isPast)
    .sort((a, b) => new Date(matchDate(b)) - new Date(matchDate(a)))
    .slice(0, 3)
);

const availableTournaments = computed(() =>
  [...(tournaments.value || [])]
    .filter((t) => ['scheduled', 'running'].includes(String(t?.status || '').toLowerCase()))
    .sort((a, b) => new Date(a?.startDate || 0) - new Date(b?.startDate || 0))
    .slice(0, 3)
);

/**
 * Locations 20km (dacă există coords)
 */
function getLocCoords(l) {
  // suportă mai multe shape-uri
  const lat = l?.lat ?? l?.latitude ?? l?.coords?.lat ?? l?.geo?.lat;
  const lng = l?.lng ?? l?.longitude ?? l?.coords?.lng ?? l?.geo?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa = s1 * s1 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

const nearbyLocations = computed(() => {
  const list = locations.value || [];
  if (!geoEnabled.value || !userPos.value) {
    return list.slice(0, 3);
  }

  const out = [];
  for (const l of list) {
    const c = getLocCoords(l);
    if (!c) continue;
    const km = haversineKm(userPos.value, c);
    if (km <= 20) out.push({ ...l, __distanceKm: km });
  }
  out.sort((a, b) => (a.__distanceKm ?? 0) - (b.__distanceKm ?? 0));
  return out.slice(0, 3);
});

function requestGeo() {
  if (!navigator.geolocation) return;
  geoBusy.value = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userPos.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      geoEnabled.value = true;
      geoBusy.value = false;
    },
    () => {
      geoEnabled.value = false;
      userPos.value = null;
      geoBusy.value = false;
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

/**
 * Utility functions
 */

function refreshHome() {
  Promise.all(
    [loadMatches(), loadTournaments(), loadLocations()]
  );
}

function onReservationCreated() {
  refreshHome();
}

function matchTitle(m) {
  return 'Match at ' + (locationNameById(m?.locationId) || 'Friendly Match');
}
function matchStatus(m) {
  return String(statusLabel(m?.status) || 'Scheduled');
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'running', label: 'Running' },
  { value: 'finished', label: 'Finished' },
];

function statusLabel(value) {
  const v = String(value || '').toLowerCase();
  return statusOptions.find((s) => s.value === v)?.label || (value ? value[0].toUpperCase() + value.slice(1) : '—');
}

function locationNameById(locationId) {
  if (!locationId) return '';
  const loc = (locations.value || []).find((x) => x.id === locationId);
  if (!loc) return '';
  return `${loc.name || '—'}${loc.city ? ` — ${loc.city}` : ''}`;
}

function matchLocationLabel(m) {
  const locationId = m?.locationId || m?.location?.id || null;
  return locationNameById(locationId);
}

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
}
function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString();
}

onMounted(() => {
  window.addEventListener('pm:reservation-created', onReservationCreated);
});

onMounted(() => {
  refreshHome();  
})

onUnmounted(() => {
  window.removeEventListener('pm:reservation-created', onReservationCreated);
});
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.home__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.home__title {
  margin: 0;
  font-size: 28px;
  font-weight: 950;
  letter-spacing: -0.02em;
}

.home__subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.home__sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.homeSection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.homeSection__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.homeSection__title {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.homeSection__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

/* Card content formatting (specific) */
.itemCard__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.itemCard__title {
  font-weight: 950;
  font-size: 14px;
}

.itemCard__meta {
  margin-top: 10px;
  color: #6b7280;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>