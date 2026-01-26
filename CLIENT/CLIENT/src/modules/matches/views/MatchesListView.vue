<template>
  <section class="page">
    <header class="pageHeader">
      <div>
        <h1 class="pageTitle">Matches</h1>
        <p class="pageSubtitle">All your matches. Filter quickly by status.</p>
      </div>

      <div class="pageHeader__actions">
        <UiSegmented v-model="filter" :options="filterOptions" aria-label="Match filter" />

        <UiButton variant="subtle" :disabled="loading" @click="load">
          {{ loading ? 'Loading…' : 'Refresh' }}
        </UiButton>
      </div>
    </header>

    <UiStateCard v-if="loading" variant="loading" :lines="3" />

    <UiStateCard v-else-if="error" variant="error" title="Error" :message="error">
      <template #action>
        <UiButton @click="load">Retry</UiButton>
      </template>
    </UiStateCard>

    <UiStateCard
      v-else-if="!filteredMatches.length"
      variant="empty"
      title="No matches found."
      :message="emptyHint"
    />

    <div v-else class="list">
      <UiCard
        v-for="m in filteredMatches"
        :key="m.id"
        as="button"
        type="button"
        size="full"
        density="lg"
        :interactive="true"
        @click="openDetails(m)"
      >
        <template #title>
          Match at {{ locationNameById(matchLocationId(m)) }}
        </template>

        <template #titleRight>
          <UiPill>{{ matchBadge(m) }}</UiPill>
        </template>

        <template #left>
          <div class="timestamps">
            <div>🗓 <span>{{ formatDateTime(matchDate(m)) }}</span></div>
            <div>🎾 <span>{{ courtLabel(m) }}</span></div>
          </div>
        </template>

        <!-- RIGHT -->
        <template #right>
          <div class="matchRight">
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
        </template>
      </UiCard>
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
import UiButton from '@/components/ui/UiButton.vue';
import UiSegmented from '@/components/ui/UiSegmented.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiPill from '@/components/ui/UiPill.vue';

const loading = ref(false);
const error = ref(null);

const matches = ref([]);

const filter = ref('all'); // all | future | finalised
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Future', value: 'future' },
  { label: 'Finalised', value: 'finalised' },
];
const details = reactive({ open: false, item: null });

const myUid = computed(() => auth.currentUser?.uid || '');

const { locations, warmupLookups, courtNameById, locationNameById, userDisplayNameById } = useLookups();

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

  if (filter.value === 'future') {
    return list
      .filter(isFuture)
      .sort((a, b) => new Date(matchDate(a)) - new Date(matchDate(b)));
  }

  if (filter.value === 'finalised') {
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
  return courtNameById(matchLocationId(m), id);
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