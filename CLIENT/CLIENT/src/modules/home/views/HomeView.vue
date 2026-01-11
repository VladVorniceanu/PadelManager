<template>
  <section class="page">
    <!-- Hero -->
    <header class="homeHero">
      <div>
        <h1 class="homeTitle">
          Welcome, <span class="homeName">{{ displayName }}</span>
        </h1>
        <p class="pageSubtitle">Quick overview of what’s happening in your Padel Manager account.</p>
      </div>
    </header>

    <div class="homeSections">
      <!-- Future matches -->
      <section class="homeSection">
        <div class="homeSection__head">
          <h2 class="homeSection__title">Your future matches</h2>
          <UiButton variant="subtle"  type="button" @click="goMatches">View all</UiButton>
        </div>

        <UiStateCard v-if="loadingMatches" variant="loading" :lines="2" />

        <UiStateCard
          v-else-if="!futureMatches.length"
          variant="empty"
          title="No upcoming matches."
          message="Create one and invite players."
        />

        <div v-else class="homeMatchesGrid">
          <UiListCard
            v-for="m in futureMatches"
            :key="m.id"
            as="button"
            variant="match"
            class="homeMatchCard"
            @click="openDetails(m)"
          >
            <template #left>
              <div class="listCard__titleRow">
                <div class="listCard__title">
                  Match at {{ locationNameById(matchLocationId(m)) }}
                </div>
              </div>

              <UiPill>{{ matchBadge(m) }}</UiPill>

              <div class="matchLeftMeta">
                <div>🎾 {{ courtLabel(m) }}</div>
                <div>🗓 {{ formatDateTime(matchDate(m)) }}</div>
              </div>
            </template>

            <template #right>
              <div class="matchRight">
                <div class="scoreBox">
                <!-- Score (sets) -->
                <div v-if="hasPadelScore(m)" class="scoreBox__score">
                  <div class="setsScore" aria-label="Sets score">
                    <div
                      v-for="(s, idx) in normalizedSets(m)"
                      :key="`${m.id}-set-${idx}`"
                      class="setCol"
                    >
                      <div class="setVal">{{ s.t1 }}</div>
                      <div class="setDash">—</div>
                      <div class="setVal">{{ s.t2 }}</div>
                    </div>
                  </div>
                </div>

                <!-- Teams -->
                <div class="teamsBox" aria-label="Teams">
                  <div class="teamCol">
                    <div
                      v-for="(uid, idx) in teamPlayers(m, 1)"
                      :key="`t1-${m.id}-${idx}`"
                      class="playerLine"
                    >
                      {{ userDisplayNameById(uid, { meUid: myUid }) }}
                    </div>
                  </div>

                  <div class="teamsDividerV" aria-hidden="true"></div>

                  <div class="teamCol">
                    <div
                      v-for="(uid, idx) in teamPlayers(m, 2)"
                      :key="`t2-${m.id}-${idx}`"
                      class="playerLine"
                    >
                      {{ userDisplayNameById(uid, { meUid: myUid }) }}
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </template>
          </UiListCard>
        </div>
      </section>

      <!-- Recent matches -->
      <section class="homeSection">
        <div class="homeSection__head">
          <h2 class="homeSection__title">Recent matches</h2>
          <UiButton variant="subtle"  type="button" @click="goMatches">View all</UiButton>
        </div>

        <UiStateCard v-if="loadingMatches" variant="loading" :lines="2" />

        <UiStateCard
          v-else-if="!recentMatches.length"
          variant="empty"
          title="No recent matches."
          message="Play a match to see history here."
        />

        <div v-else class="homeMatchesGrid">
          <UiListCard
            v-for="m in recentMatches"
            :key="m.id"
            as="button"
            variant="match"
            class="homeMatchCard"
            @click="openDetails(m)"
          >
            <template #left>
              <div class="listCard__titleRow">
                <div class="listCard__title">
                  Match at {{ locationNameById(matchLocationId(m)) }}
                </div>
              </div>

              <UiPill>{{ matchBadge(m) }}</UiPill>

              <div class="matchLeftMeta">
                <div>🗓 {{ formatDateTime(matchDate(m)) }}</div>
                <div>🎾 {{ courtLabel(m) }}</div>
              </div>
            </template>

            <template #right>
              <div class="matchRight">
                <div class="scoreBox">
                <div v-if="hasPadelScore(m)" class="scoreBox__score">
                  <div class="setsScore" aria-label="Sets score">
                    <div
                      v-for="(s, idx) in normalizedSets(m)"
                      :key="`${m.id}-set-${idx}`"
                      class="setCol"
                    >
                      <div class="setVal">{{ s.t1 }}</div>
                      <div class="setDash">—</div>
                      <div class="setVal">{{ s.t2 }}</div>
                    </div>
                  </div>
                </div>

                <div class="teamsBox" aria-label="Teams">
                  <div class="teamCol">
                    <div
                      v-for="(uid, idx) in teamPlayers(m, 1)"
                      :key="`t1-${m.id}-${idx}`"
                      class="playerLine"
                    >
                      {{ userDisplayNameById(uid, { meUid: myUid }) }}
                    </div>
                  </div>

                  <div class="teamsDividerV" aria-hidden="true"></div>

                  <div class="teamCol">
                    <div
                      v-for="(uid, idx) in teamPlayers(m, 2)"
                      :key="`t2-${m.id}-${idx}`"
                      class="playerLine"
                    >
                      {{ userDisplayNameById(uid, { meUid: myUid }) }}
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </template>
          </UiListCard>
        </div>
      </section>

      <!-- Locations nearby -->
      <section class="homeSection">
        <div class="homeSection__head">
          <h2 class="homeSection__title">Locations</h2>

          <div class="homeSection__actions">
            <UiButton variant="subtle"  type="button" @click="requestGeo" :disabled="geoBusy">
              {{ geoBusy ? 'Locating…' : geoEnabled ? 'Location enabled' : 'Use my location' }}
            </UiButton>
            <UiButton variant="subtle"  type="button" @click="goLocations">View all</UiButton>
          </div>
        </div>

        <UiStateCard v-if="loadingLookups" variant="loading" :lines="2" />

        <UiStateCard
          v-else-if="!nearbyLocations.length"
          variant="empty"
          title="No locations to show."
          :message="geoEnabled ? 'No locations found within 20km (or missing coordinates).' : 'Enable location to see nearby results.'"
        />

        <div v-else class="grid3">
          <UiCard v-for="l in nearbyLocations" :key="l.id" as="article">
            <div class="itemCard__top">
              <div class="itemCard__title">{{ l.name || '—' }}</div>
              <UiPill>{{ (l.courts?.length ?? 0) }} courts</UiPill>
            </div>
            <div class="itemCard__meta">
              <div>📍 {{ [l.city, l.address].filter(Boolean).join(' — ') || '—' }}</div>
              <div v-if="l.__distanceKm != null">📏 {{ l.__distanceKm.toFixed(1) }} km</div>
            </div>
          </UiCard>
        </div>
      </section>

      <!-- Available tournaments -->
      <section class="homeSection">
        <div class="homeSection__head">
          <h2 class="homeSection__title">Available tournaments</h2>
          <UiButton variant="subtle"  type="button" @click="goTournaments">View all</UiButton>
        </div>

        <UiStateCard v-if="loadingTournaments" variant="loading" :lines="2" />

        <UiStateCard
          v-else-if="!availableTournaments.length"
          variant="empty"
          title="No tournaments available."
          message="Check back later."
        />

        <div v-else class="grid3">
          <UiCard v-for="t in availableTournaments" :key="t.id" as="article">
            <div class="itemCard__top">
              <div class="itemCard__title">{{ t.name || '—' }}</div>
              <UiPill>{{ statusLabel(t.status) }}</UiPill>
            </div>
            <div class="itemCard__meta">
              <div>🗓 {{ formatDate(t.startDate) }} → {{ formatDate(t.endDate) }}</div>
              <div>📍 {{ locationNameById(t.locationId) }}</div>
            </div>
          </UiCard>
        </div>
      </section>
    </div>

    <!-- Details modal -->
    <MatchDetailsModal
      v-if="details.open && details.item"
      :match="details.item"
      :locations="locations"
      :my-uid="myUid"
      @close="closeDetails"
      @updated="onMatchUpdated"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiPill from '@/components/ui/UiPill.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';
import UiListCard from '@/components/ui/UiListCard.vue';

import { useRouter } from 'vue-router';
import { auth } from '@/services/firebase';
import { httpClient } from '@/api/httpClient';
import { useLookups } from '@/composables/useLookups';
import MatchDetailsModal from '@/modules/matches/views/MatchDetailsModal.vue';

const router = useRouter();

const {
  warmupLookups,
  locations,
  courtNameById,
  locationNameById,
  userDisplayNameById,
} = useLookups();

// ---- local state (home-specific API only) ----
const loadingMatches = ref(false);
const loadingTournaments = ref(false);
const loadingLookups = ref(false);

const matches = ref([]);
const tournaments = ref([]);

// geo
const geoBusy = ref(false);
const geoEnabled = ref(false);
const userPos = ref(null); // {lat,lng}

// modal state
const details = reactive({ open: false, item: null });

// ---- computed ----
const myUid = computed(() => auth.currentUser?.uid || '');
const displayName = computed(() => {
  const u = auth.currentUser;
  return u?.displayName || u?.email || 'player';
});

// ---- routing ----
function goMatches() {
  router.push({ name: 'friendly-list' }).catch(() => {});
}
function goLocations() {
  router.push({ name: 'locations-list' }).catch(() => {});
}
function goTournaments() {
  router.push({ name: 'tournaments-list' }).catch(() => {});
}

// ---- loaders ----
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

async function refreshHome() {
  await Promise.allSettled([loadMatches(), loadTournaments()]);
}

// ---- match helpers (same “shape-safe” style as MatchesListView) ----
function matchDate(m) {
  return m?.scheduledAt;
}
function isFuture(m) {
  const d = new Date(matchDate(m));
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
}

function matchBadge(m) {
  const status = String(m?.status || '').toLowerCase();
  if (status === 'completed') return 'Completed';
  if (status === 'ongoing') return 'Ongoing';
  if (status === 'scheduled' && isFuture(m)) return 'Future'
  else {
    
    return 'Completed';
  }
}

function matchLocationId(m) {
  return m?.locationId;
}

function courtLabel(m) {
  const id = m?.courtId;
  if (id) return courtNameById( matchLocationId(m), id) || `Court ${String(id).slice(0, 6)}`;
}

function matchParticipants(m) {
  const t1 = m?.teams?.team1;
  const t2 = m?.teams?.team2;
  if (Array.isArray(t1) || Array.isArray(t2)) return [...(t1 || []), ...(t2 || [])].filter(Boolean);
  return [];
}

function isMyMatch(m) {
  const uid = myUid.value;
  if (!uid) return false;
  if (m?.createdBy === uid) return true;
  return matchParticipants(m).includes(uid);
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
    .filter((m) => !isFuture(m))
    .sort((a, b) => new Date(matchDate(b)) - new Date(matchDate(a)))
    .slice(0, 3)
);

// ---- score helpers ----
function normalizedSets(m) {
  const sets = m?.score?.sets;
  if (!Array.isArray(sets)) return [];
  return sets
    .map((s) => ({ t1: Number(s?.t1 ?? 0), t2: Number(s?.t2 ?? 0) }))
    .filter((s) => Number.isFinite(s.t1) && Number.isFinite(s.t2));
}
function hasPadelScore(m) {
  return normalizedSets(m).length > 0;
}

// ---- teams helpers ----
function teamPlayers(m, teamNo) {
  const teams = m?.teams;
  if (teams?.team1 || teams?.team2) {
    const arr = teamNo === 1 ? teams.team1 : teams.team2;
    return Array.isArray(arr) ? arr.filter((x) => x != null) : [];
  }
  const all = matchParticipants(m);
  const half = Math.ceil(all.length / 2);
  return teamNo === 1 ? all.slice(0, half) : all.slice(half);
}

// ---- tournaments ----
const availableTournaments = computed(() =>
  [...(tournaments.value || [])]
    .filter((t) => ['scheduled', 'running'].includes(String(t?.status || '').toLowerCase()))
    .sort((a, b) => new Date(a?.startDate || 0) - new Date(b?.startDate || 0))
    .slice(0, 3)
);

function statusLabel(value) {
  const v = String(value || '').toLowerCase();
  if (v === 'scheduled') return 'Scheduled';
  if (v === 'ongoing') return 'Ongoing';
  if (v === 'completed') return 'Completed';
  return value ? value[0].toUpperCase() + value.slice(1) : '—';
}

// ---- locations (from lookups store, not API call here) ----
function getLocCoords(l) {
  const lat = l?.lat ?? l?.latitude ?? l?.coords?.lat ?? l?.geo?.lat;
  const lng = l?.lng ?? l?.longitude ?? l?.coords?.lng ?? l?.geo?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
}
function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa = s1 * s1 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

const nearbyLocations = computed(() => {
  const list = locations.value || [];
  if (!geoEnabled.value || !userPos.value) return list.slice(0, 3);

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

// ---- modal handlers ----
function openDetails(m) {
  details.item = m;
  details.open = true;
}
function closeDetails() {
  details.open = false;
  details.item = null;
}
function onMatchUpdated(updated) {
  if (!updated?.id) return;
  matches.value = (matches.value || []).map((x) => (x.id === updated.id ? updated : x));
  if (details.item?.id === updated.id) details.item = updated;
}

// ---- utils ----
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

// ---- events ----
function onReservationCreated() {
  refreshHome();
}

onMounted(async () => {
  window.addEventListener('pm:reservation-created', onReservationCreated);

  loadingLookups.value = true;
  await warmupLookups().catch(() => {});
  loadingLookups.value = false;

  await refreshHome();
});

onUnmounted(() => {
  window.removeEventListener('pm:reservation-created', onReservationCreated);
});
</script>

<style scoped>
/* local: keep minimal, rely on global UI primitives */
.homeHero { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap; }
.homeTitle { margin: 0; font-size: 28px; font-weight: 950; letter-spacing: -0.02em; }
.homeName { font-weight: 950; }

.homeSections { display: flex; flex-direction: column; gap: 14px; }
.homeSection { display: flex; flex-direction: column; gap: 10px; }

.homeSection__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.homeSection__title { margin: 0; font-size: 16px; font-weight: 900; letter-spacing: -0.01em; }
.homeSection__actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

/* cards in grid3 (Locations / Tournaments) */
.itemCard__top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.itemCard__title { font-weight: 950; font-size: 14px; }
.itemCard__meta {
  margin-top: 10px;
  color: var(--ui-muted);
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>