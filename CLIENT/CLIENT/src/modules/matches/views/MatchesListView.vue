<template>
  <section class="page">
    <header class="pageHeader">
      <div>
        <h1 class="pageTitle">Matches</h1>
        <p class="pageSubtitle">All your matches. Filter quickly by status.</p>
      </div>

      <div class="pageHeader__actions">
        <div class="segmented" role="tablist" aria-label="Match filter">
          <button class="segmented__btn" :class="{ active: filter === 'all' }" type="button" @click="filter = 'all'">
            All
          </button>
          <button class="segmented__btn" :class="{ active: filter === 'upcoming' }" type="button" @click="filter = 'upcoming'">
            Upcoming
          </button>
          <button class="segmented__btn" :class="{ active: filter === 'finalised' }" type="button" @click="filter = 'finalised'">
            Finalised
          </button>
        </div>

        <button class="btn subtle" :disabled="loading" @click="load">
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </header>

    <div v-if="loading" class="card">
      <div class="skeletonLine"></div>
      <div class="skeletonLine"></div>
      <div class="skeletonLine"></div>
    </div>

    <div v-else-if="error" class="card error">
      <div class="errorTitle">Error</div>
      <div class="errorMsg">{{ error }}</div>
      <button class="btn" @click="load">Retry</button>
    </div>

    <div v-else-if="!filteredMatches.length" class="card empty">
      <div class="emptyTitle">No matches found.</div>
      <div class="emptyMsg">{{ emptyHint }}</div>
    </div>

    <div v-else class="list">
      <button
        v-for="m in filteredMatches"
        :key="m.id"
        type="button"
        class="listCard listCard--match"
        @click="openDetails(m)"
      >
        <!-- LEFT -->
        <div class="listCard__left">
          <div class="listCard__titleRow">
            <div class="listCard__title">
              Match at {{ locationNameById(matchLocationId(m)) }}
            </div>
          </div>

          <span class="pill">{{ matchBadge(m) }}</span>

          <div class="matchLeftMeta">
            <div>🗓 {{ formatDateTime(matchDate(m)) }}</div>
            <div>🎾 {{ courtLabel(m) }}</div>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="listCard__right matchRight">
          <div class="scoreBox">
            <!-- Score (sets) -->
            <div v-if="hasPadelScore(m)" class="scoreBox__score">
              <div class="setsScore" aria-label="Sets score">
                <div v-for="(s, idx) in normalizedSets(m)" :key="`${m.id}-set-${idx}`" class="setCol">
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
      </button>
    </div>

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
import { auth } from '@/services/firebase';
import { httpClient } from '@/api/httpClient';
import { useLookups } from '@/composables/useLookups';
import MatchDetailsModal from './MatchDetailsModal.vue';

const loading = ref(false);
const error = ref(null);

const matches = ref([]);

const filter = ref('all');
const details = reactive({ open: false, item: null });

const myUid = computed(() => auth.currentUser?.uid || '');

const { locations, warmupLookups, locationNameById, userDisplayNameById } = useLookups();

const emptyHint = computed(() => {
  if (filter.value === 'future') return 'No upcoming matches. Book one and invite players.';
  if (filter.value === 'finalised') return 'No finalised matches yet. Play a match to build history.';
  return 'Book a match to start playing.';
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await httpClient.get('/matches');
    matches.value = res?.data?.data ?? res?.data ?? [];
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Failed to load matches.';
  } finally {
    loading.value = false;
  }
}

/**
 * Match helpers (schema: teams.team1/team2 arrays with uid|null)
 */
function matchParticipants(m) {
  const t1 = m?.teams?.team1;
  const t2 = m?.teams?.team2;
  return [...(Array.isArray(t1) ? t1 : []), ...(Array.isArray(t2) ? t2 : [])].filter(Boolean);
}

function isMyMatch(m) {
  const uid = myUid.value;
  if (!uid) return false;
  if (m?.createdBy === uid) return true;
  return matchParticipants(m).includes(uid);
}

const myMatches = computed(() => (matches.value || []).filter(isMyMatch));

function matchDate(m) {
  return m?.scheduledAt || m?.startTime || m?.date || m?.createdAt || null;
}
function matchEnd(m) {
  return m?.endAt || m?.endTime || null;
}

function isFuture(m) {
  const d = new Date(matchDate(m));
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > Date.now();
}

/**
 * SCORE (PADEL): score = { sets:[{t1,t2}, ...] }
 */
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

function isCompleted(m) {
  const status = String(m?.status || '').toLowerCase();
  if (status === 'completed') return true;

  const end = new Date(matchEnd(m));
  if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) return true;

  return hasPadelScore(m);
}

function matchBadge(m) {
  const status = String(m?.status || '').toLowerCase();
  if (status === 'completed') return 'Completed';
  if (status === 'ongoing') return 'Ongoing';
  if (isFuture(m)) return 'Upcoming';
  return 'Scheduled';
}

const filteredMatches = computed(() => {
  const list = [...myMatches.value];

  if (filter.value === 'upcoming') {
    return list
      .filter(isFuture)
      .sort((a, b) => new Date(matchDate(a)) - new Date(matchDate(b)));
  }

  if (filter.value === 'completed') {
    return list
      .filter(isCompleted)
      .sort((a, b) => new Date(matchDate(b)) - new Date(matchDate(a)));
  }

  return list.sort((a, b) => new Date(matchDate(b)) - new Date(matchDate(a)));
});

/**
 * Location / court labels
 */
function matchLocationId(m) {
  return m?.locationId;
}

function courtLabel(m) {
  const id = m?.courtId;
  if (id) return `Court ${String(id).slice(0, 6)}`;
  return 'Court —';
}

/**
 * Teams display
 */
function teamPlayers(m, teamNo) {
  const teams = m?.teams;
  if (teams?.team1 || teams?.team2) {
    const arr = teamNo === 1 ? teams.team1 : teams.team2;
    return Array.isArray(arr) ? arr.filter((x) => x != null) : [];
  }
  // fallback
  const all = matchParticipants(m);
  const half = Math.ceil(all.length / 2);
  return teamNo === 1 ? all.slice(0, half) : all.slice(half);
}

/**
 * Modal
 */
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

/**
 * Utils
 */
function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString();
}

/**
 */
function onReservationCreated() {
  load();
}

onMounted(async () => {
  window.addEventListener('pm:reservation-created', onReservationCreated);
  await warmupLookups();
  load();
});

onUnmounted(() => {
  window.removeEventListener('pm:reservation-created', onReservationCreated);
});
</script>

<style scoped>
</style>