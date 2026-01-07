<template>
  <section class="page">
    <header class="pageHeader">
      <div>
        <h1 class="pageTitle">Matches</h1>
        <p class="pageSubtitle">All your matches. Filter quickly by status.</p>
      </div>

      <div class="pageHeader__actions">
        <div class="segmented" role="tablist" aria-label="Match filter">
          <button
            class="segmented__btn"
            :class="{ active: filter === 'all' }"
            type="button"
            @click="filter = 'all'"
          >
            All
          </button>
          <button
            class="segmented__btn"
            :class="{ active: filter === 'future' }"
            type="button"
            @click="filter = 'future'"
          >
            Future
          </button>
          <button
            class="segmented__btn"
            :class="{ active: filter === 'finalised' }"
            type="button"
            @click="filter = 'finalised'"
          >
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
      <div class="emptyMsg">
        {{ emptyHint }}
      </div>
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
              Match at {{ locationNameById(matchLocationId(m)) || 'Location' }}
            </div>

            <span class="pill">{{ matchBadge(m) }}</span>
          </div>

          <div class="matchLeftMeta">
            <div>🗓 {{ formatDateTime(matchDate(m)) }}</div>
            <div>🎾 {{ courtLabel(m) }}</div>
          </div>
        </div>

        <!-- RIGHT (flush to right) -->
        <div class="listCard__right matchRight">
          <div class="scoreBox">
            <!-- Padel score: sets + (optional) games/tiebreak -->
            <div class="scoreBox__score">
              <template v-if="hasPadelScore(m)">
                <div class="scoreMain">
                  {{ formatPadelSets(m) }}
                </div>
                <div v-if="formatPadelGames(m)" class="scoreSub">
                  {{ formatPadelGames(m) }}
                </div>
              </template>
              <template v-else>
                <div class="scoreMain">— : —</div>
                <div class="scoreSub">No score yet</div>
              </template>
            </div>

            <!-- Teams: side-by-side with vertical divider -->
            <div class="scoreBox__teams teamsGrid">
              <div class="teamCol">
                <div
                  v-for="(p, idx) in teamPlayers(m, 1)"
                  :key="`t1-${m.id}-${idx}`"
                  class="playerLine"
                >
                  {{ formatPlayer(p) }}
                </div>
              </div>

              <div class="teamsDividerV" aria-hidden="true"></div>

              <div class="teamCol">
                <div
                  v-for="(p, idx) in teamPlayers(m, 2)"
                  :key="`t2-${m.id}-${idx}`"
                  class="playerLine"
                >
                  {{ formatPlayer(p) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>

    <!-- Details modal -->
    <MatchDetailsModal
      v-if="details.open && details.item"
      :match="details.item"
      :locations="locations"
      :my-uid="myUid"
      @close="closeDetails"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { auth } from '@/services/firebase';
import { httpClient } from '@/api/httpClient';
import { fetchLocations } from '@/api/locationsApi';
import MatchDetailsModal from './MatchDetailsModal.vue';

const loading = ref(false);
const error = ref(null);

const matches = ref([]);
const locations = ref([]);

const filter = ref('all'); // 'all' | 'future' | 'finalised'

const details = reactive({
  open: false,
  item: null,
});

const myUid = computed(() => auth.currentUser?.uid || '');

const emptyHint = computed(() => {
  if (filter.value === 'future') return 'No upcoming matches. Book one and invite players.';
  return 'Book a match to start playing.';
});

/**
 * Data loading
 */
async function load() {
  loading.value = true;
  error.value = null;

  try {
    const [matchesRes, locs] = await Promise.all([
      httpClient.get('/matches'),
      fetchLocations().catch(() => []),
    ]);

    matches.value = matchesRes?.data?.data ?? matchesRes?.data ?? [];
    locations.value = locs ?? [];
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Failed to load matches.';
  } finally {
    loading.value = false;
  }
}

/**
 * Match helpers (best-effort, schema-safe)
 */
function matchParticipants(m) {
  if (Array.isArray(m?.participants)) return m.participants;
  if (Array.isArray(m?.playerIds)) return m.playerIds;

  const teams = m?.teams;
  if (Array.isArray(teams)) return teams.flatMap((t) => t?.players ?? []);
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

const myMatches = computed(() => (matches.value || []).filter(isMyMatch));

function matchDate(m) {
  return m?.scheduledAt || m?.startTime || m?.date || m?.createdAt || null;
}

function isFuture(m) {
  const startTime = new Date(matchDate(m));
  if (Number.isNaN(startTime.getTime())) return false;
  return startTime.getTime() > Date.now();
}

/**
 * Padel score parsing:
 * Accepts shapes like:
 * - m.score = { sets: [[6,4],[3,6],[10,8]], games: [ { team1: 6, team2: 4 }, ... ] } (whatever)
 * - m.score = { team1Sets: 2, team2Sets: 1 } + optional games
 * - m.score = { sets: [{ team1: 6, team2: 4 }, ...] }
 * - m.score = [[6,4],[3,6],[6,2]] etc
 */
function extractPadelScore(m) {
  const s = m?.score ?? m?.result ?? null;
  if (!s) return null;

  // Array of sets: [[6,4], [3,6], [10,8]] (super tiebreak is still a set)
  if (Array.isArray(s) && s.length && (Array.isArray(s[0]) || typeof s[0] === 'object')) {
    const sets = [];
    for (const it of s) {
      if (Array.isArray(it) && it.length >= 2) {
        const a = Number(it[0]);
        const b = Number(it[1]);
        if (Number.isFinite(a) && Number.isFinite(b)) sets.push([a, b]);
      } else if (it && typeof it === 'object') {
        const a = Number(it.team1 ?? it.teamA ?? it.home ?? it.a ?? it.t1);
        const b = Number(it.team2 ?? it.teamB ?? it.away ?? it.b ?? it.t2);
        if (Number.isFinite(a) && Number.isFinite(b)) sets.push([a, b]);
      }
    }
    return sets.length ? { sets } : null;
  }

  if (typeof s === 'object') {
    // canonical: { sets: [...] }
    if (Array.isArray(s.sets)) {
      const sets = [];
      for (const it of s.sets) {
        if (Array.isArray(it) && it.length >= 2) {
          const a = Number(it[0]);
          const b = Number(it[1]);
          if (Number.isFinite(a) && Number.isFinite(b)) sets.push([a, b]);
        } else if (it && typeof it === 'object') {
          const a = Number(it.team1 ?? it.teamA ?? it.home ?? it.a ?? it.t1);
          const b = Number(it.team2 ?? it.teamB ?? it.away ?? it.b ?? it.t2);
          if (Number.isFinite(a) && Number.isFinite(b)) sets.push([a, b]);
        }
      }
      const games = Array.isArray(s.games) ? s.games : null;
      return sets.length ? { sets, games } : null;
    }

    // fallback: already aggregated sets count: { team1Sets: 2, team2Sets: 1 }
    const aSets = s.team1Sets ?? s.teamASets ?? s.homeSets ?? s.setsTeam1;
    const bSets = s.team2Sets ?? s.teamBSets ?? s.awaySets ?? s.setsTeam2;
    if (Number.isFinite(Number(aSets)) && Number.isFinite(Number(bSets))) {
      return { setsCount: [Number(aSets), Number(bSets)], games: Array.isArray(s.games) ? s.games : null };
    }
  }

  return null;
}

function hasPadelScore(m) {
  const sc = extractPadelScore(m);
  if (!sc) return false;
  if (Array.isArray(sc.sets) && sc.sets.length) return true;
  if (Array.isArray(sc.setsCount) && sc.setsCount.length === 2) return true;
  return false;
}

function countSetsFromSetList(sets) {
  let a = 0;
  let b = 0;
  for (const [x, y] of sets) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x > y) a += 1;
    else if (y > x) b += 1;
  }
  return [a, b];
}

function formatPadelSets(m) {
  const sc = extractPadelScore(m);
  if (!sc) return '— : —';

  // If we have per-set games, show sets won like "2–1"
  if (Array.isArray(sc.sets) && sc.sets.length) {
    const [aSets, bSets] = countSetsFromSetList(sc.sets);
    return `${aSets}–${bSets}`;
  }

  // If API already gives set counts
  if (Array.isArray(sc.setsCount) && sc.setsCount.length === 2) {
    return `${sc.setsCount[0]}–${sc.setsCount[1]}`;
  }

  return '— : —';
}

function formatPadelGames(m) {
  const sc = extractPadelScore(m);
  if (!sc) return '';

  // If we have explicit per-set games list, show like "6–4, 3–6, 10–8"
  if (Array.isArray(sc.sets) && sc.sets.length) {
    const parts = sc.sets.map(([a, b]) => `${a}–${b}`);
    return parts.join(', ');
  }

  // If we only have games array (unknown shape), attempt to read it
  if (Array.isArray(sc.games) && sc.games.length) {
    const parts = [];
    for (const it of sc.games) {
      if (Array.isArray(it) && it.length >= 2) {
        const a = Number(it[0]);
        const b = Number(it[1]);
        if (Number.isFinite(a) && Number.isFinite(b)) parts.push(`${a}–${b}`);
      } else if (it && typeof it === 'object') {
        const a = Number(it.team1 ?? it.teamA ?? it.home ?? it.a ?? it.t1);
        const b = Number(it.team2 ?? it.teamB ?? it.away ?? it.b ?? it.t2);
        if (Number.isFinite(a) && Number.isFinite(b)) parts.push(`${a}–${b}`);
      }
    }
    return parts.length ? parts.join(', ') : '';
  }

  return '';
}

function isFinalised(m) {
  const status = String(m?.status || '').toLowerCase();
  const endTime = new Date(m?.endTime || null);
  if (status === 'finished' || endTime < Date.now()) return true;
  return hasPadelScore(m);
}

function matchBadge(m) {
  if (isFinalised(m)) return 'Finalised';
  if (isFuture(m)) return 'Future';
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
      .filter(isFinalised)
      .sort((a, b) => new Date(matchDate(b)) - new Date(matchDate(a)));
  }

  return list.sort((a, b) => new Date(matchDate(b)) - new Date(matchDate(a)));
});

/**
 * Location / court labels
 */
function matchLocationId(m) {
  return m?.locationId || m?.location?.id || m?.reservation?.locationId || null;
}

function locationNameById(locationId) {
  if (!locationId) return '';
  const loc = (locations.value || []).find((x) => x.id === locationId);
  if (!loc) return '';
  return `${loc.name || '—'}${loc.city ? ` — ${loc.city}` : ''}`;
}

function matchCourtId(m) {
  return m?.courtId || m?.court?.id || m?.reservation?.courtId || null;
}

function courtLabel(m) {
  const name = m?.court?.name || m?.reservation?.courtName || m?.courtName || null;
  const id = matchCourtId(m);
  if (name) return name;
  if (id) return `Court ${String(id).slice(0, 6)}`;
  return 'Court —';
}

/**
 * Teams / players display (best-effort)
 */
function teamPlayers(m, teamNo) {
  const teams = m?.teams;

  if (Array.isArray(teams)) {
    const t = teams[teamNo - 1];
    const p = t?.players ?? [];
    return Array.isArray(p) ? p : [];
  }

  if (teams?.team1 || teams?.team2) {
    const t = teamNo === 1 ? teams.team1 : teams.team2;
    const p = t?.players ?? [];
    return Array.isArray(p) ? p : [];
  }

  const all = matchParticipants(m);
  if (!all.length) return [];
  const half = Math.ceil(all.length / 2);
  return teamNo === 1 ? all.slice(0, half) : all.slice(half);
}

function formatPlayer(p) {
  const uid = typeof p === 'string' ? p : (p?.uid || p?.id || p?.userId || '');
  const display = typeof p === 'object' ? (p?.displayName || p?.name || '') : '';
  if (!uid && !display) return '—';
  if (uid && uid === myUid.value) return 'Me';
  if (display) return display;
  return `User ${String(uid).slice(0, 6)}`;
}

/**
 * Modal open/close
 */
function openDetails(m) {
  details.item = m;
  details.open = true;
}
function closeDetails() {
  details.open = false;
  details.item = null;
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
 * Refresh when reservation is created elsewhere (toolbar modal)
 */
function onReservationCreated() {
  load();
}

onMounted(() => {
  window.addEventListener('pm:reservation-created', onReservationCreated);
  load();
});

onUnmounted(() => {
  window.removeEventListener('pm:reservation-created', onReservationCreated);
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.pageHeader__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.pageTitle { margin: 0; font-size: 22px; font-weight: 950; letter-spacing: -0.02em; }
.pageSubtitle { margin: 6px 0 0; font-size: 13px; color: #6b7280; }

.list { display: flex; flex-direction: column; gap: 12px; }

/* Match card layout: ensure right block is flush right */
.listCard--match {
  display: flex;
  align-items: stretch;
  gap: 16px;
}

/* IMPORTANT: push right block to edge */
.listCard--match .listCard__left {
  flex: 1 1 auto;
  min-width: 0;
}
.listCard--match .listCard__right {
  flex: 0 0 auto;
  margin-left: auto; /* ✅ flush right */
}

.matchLeftMeta {
  margin-top: 8px;
  color: #6b7280;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Right block wrapper */
.matchRight { display: flex; justify-content: flex-end; }

/* Score + players block on the right */
.scoreBox {
  width: 260px;              /* fixed so it aligns nicely */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.scoreBox__score {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  padding: 10px 12px;
  text-align: center;
}

.scoreMain {
  font-weight: 950;
  letter-spacing: -0.02em;
  font-size: 20px;
  line-height: 1.1;
}

.scoreSub {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Teams: 2 columns with vertical divider */
.teamsGrid {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  padding: 10px 12px;

  display: grid;
  grid-template-columns: 1fr 1px 1fr; /* ✅ side by side */
  column-gap: 10px;
  align-items: start;
}

.teamCol {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.playerLine {
  font-size: 12px;
  color: #374151;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.teamsDividerV {
  width: 1px;
  background: #e5e7eb;
  height: 100%;
}

/* Filter segmented */
.segmented {
  display: inline-flex;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}

.segmented__btn {
  border: none;
  background: transparent;
  padding: 10px 12px;
  font-weight: 800;
  cursor: pointer;
  color: #374151;
}

.segmented__btn.active {
  background: #111827;
  color: #fff;
}

.segmented__btn:not(.active):hover {
  background: #f9fafb;
}

@media (max-width: 900px) {
  .listCard--match {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .listCard--match .listCard__right {
    margin-left: 0;
  }

  .matchRight {
    justify-content: flex-start;
  }

  .scoreBox {
    width: 100%;
    align-items: flex-start;
  }
}
</style>