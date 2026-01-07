<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="modal modal--wide" role="dialog" aria-modal="true">
      <div class="modalHeader">
        <div>
          <div class="modalTitle">
            Match at {{ locationNameById(matchLocationId(match)) || 'Location' }}
          </div>
          <div class="modalSubtitle">
            {{ formatDateTime(matchDate(match)) }}
            <span class="dot">•</span>
            {{ courtLabel(match) }}
          </div>
        </div>

        <button class="iconBtn" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <div class="modalBody">
        <div class="detailsGrid">
          <section class="detailsCol">
            <div class="detailsCard">
              <div class="detailsLabel">Status</div>
              <div class="detailsValue">{{ matchBadge(match) }}</div>
            </div>

            <div class="detailsCard">
              <div class="detailsLabel">Score</div>
              <div class="detailsValue detailsValue--sm">
                <template v-if="hasFinalScore(match)">
                  {{ formatScore(match) }}
                </template>
                <template v-else>
                  No score yet.
                </template>
              </div>
              <div class="detailsMeta">Score is available when the match has been finalised.</div>
            </div>

            <div class="detailsCard">
              <div class="detailsLabel">Teams</div>

              <div class="teams teams--details">
                <div class="teamCol">
                  <div class="teamTitle">Team 1</div>
                  <div v-for="(p, idx) in teamPlayers(match, 1)" :key="`d-t1-${idx}`" class="playerLine">
                    {{ formatPlayer(p) }}
                  </div>
                </div>

                <div class="teamsDivider" aria-hidden="true"></div>

                <div class="teamCol">
                  <div class="teamTitle">Team 2</div>
                  <div v-for="(p, idx) in teamPlayers(match, 2)" :key="`d-t2-${idx}`" class="playerLine">
                    {{ formatPlayer(p) }}
                  </div>
                </div>
              </div>
            </div>

            <details class="card details">
              <summary>Raw payload</summary>
              <pre class="json">{{ pretty(match) }}</pre>
            </details>
          </section>

          <section class="mapCol">
            <div class="mapFrame">
              <iframe
                v-if="mapSrc"
                :src="mapSrc"
                width="100%"
                height="100%"
                style="border:0;"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              />
              <div v-else class="mapEmpty">
                No map coordinates available for this location.
              </div>
            </div>

            <div class="detailsActions">
              <button class="btn" @click="$emit('close')">Close</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  match: { type: Object, required: true },
  locations: { type: Array, default: () => [] },
  myUid: { type: String, default: '' },
});

// ------- Location helpers -------
function matchLocationId(m) {
  return m?.locationId || m?.location?.id || m?.reservation?.locationId || null;
}

function locationById(id) {
  if (!id) return null;
  return (props.locations || []).find((x) => x.id === id) || null;
}

function locationNameById(id) {
  const loc = locationById(id);
  if (!loc) return '';
  return `${loc.name || '—'}${loc.city ? ` — ${loc.city}` : ''}`;
}

function getLocCoords(l) {
  const lat = l?.lat ?? l?.latitude ?? l?.coords?.lat ?? l?.geo?.lat;
  const lng = l?.lng ?? l?.longitude ?? l?.coords?.lng ?? l?.geo?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
}

const mapSrc = computed(() => {
  const loc = locationById(matchLocationId(props.match));
  const c = getLocCoords(loc);
  if (!c) return '';
  const bbox = `${c.lng - 0.01},${c.lat - 0.01},${c.lng + 0.01},${c.lat + 0.01}`;
  const marker = `${c.lat},${c.lng}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
});

// ------- Match parsing -------
function matchDate(m) {
  return m?.scheduledAt || m?.startTime || m?.date || m?.createdAt || null;
}

function isFuture(m) {
  const d = new Date(matchDate(m));
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > Date.now();
}

function hasFinalScore(m) {
  const s = m?.score ?? m?.result ?? null;
  if (!s) return false;
  if (Array.isArray(s) && s.length >= 2) return Number.isFinite(Number(s[0])) && Number.isFinite(Number(s[1]));
  const a = s.team1 ?? s.teamA ?? s.home;
  const b = s.team2 ?? s.teamB ?? s.away;
  return Number.isFinite(Number(a)) && Number.isFinite(Number(b));
}

function isFinalised(m) {
  const status = String(m?.status || '').toLowerCase();
  if (status === 'finished' || status === 'finalised' || status === 'completed') return true;
  return hasFinalScore(m);
}

function matchBadge(m) {
  if (isFinalised(m)) return 'Finalised';
  if (isFuture(m)) return 'Future';
  return 'Scheduled';
}

// ------- Court -------
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

// ------- Teams & players -------
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
  if (uid && uid === props.myUid) return 'Me';
  if (display) return display;
  return `User ${String(uid).slice(0, 6)}`;
}

// ------- Score formatting -------
function formatScore(m) {
  const s = m?.score ?? m?.result ?? null;
  if (!s) return '— : —';
  if (Array.isArray(s)) return `${s[0] ?? '—'} : ${s[1] ?? '—'}`;
  const a = s.team1 ?? s.teamA ?? s.home;
  const b = s.team2 ?? s.teamB ?? s.away;
  return `${a ?? '—'} : ${b ?? '—'}`;
}

// ------- utils -------
function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString();
}

function pretty(obj) {
  try { return JSON.stringify(obj, null, 2); }
  catch { return String(obj); }
}
</script>

<style scoped>
.modalBody { padding: 16px; }

.detailsGrid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 14px;
}
@media (max-width: 900px) {
  .detailsGrid { grid-template-columns: 1fr; }
}

.detailsCol { display: flex; flex-direction: column; gap: 12px; }

.detailsCard {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 16px;
  padding: 14px;
}

.detailsLabel { color: #6b7280; font-size: 12px; font-weight: 800; }
.detailsValue { font-size: 22px; font-weight: 950; margin-top: 6px; letter-spacing: -0.02em; }
.detailsValue--sm { font-size: 14px; font-weight: 900; }
.detailsMeta { margin-top: 8px; color: #6b7280; font-size: 12px; line-height: 1.4; }

.mapCol { display: flex; flex-direction: column; gap: 12px; }

.mapFrame {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  background: #f9fafb;
  height: 420px;
}
@media (max-width: 900px) {
  .mapFrame { height: 320px; }
}

.mapEmpty {
  height: 100%;
  display: grid;
  place-items: center;
  color: #6b7280;
  font-size: 13px;
  padding: 14px;
  text-align: center;
}

.detailsActions { display: flex; justify-content: flex-end; gap: 10px; }

.modal--wide { width: min(980px, 96vw); }
.dot { opacity: .6; margin: 0 6px; }

.teams {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.teamCol { display: flex; flex-direction: column; gap: 4px; }
.teamTitle { font-weight: 900; font-size: 12px; color: #111827; margin-bottom: 2px; }
.playerLine { font-size: 12px; color: #374151; font-weight: 700; }
.teamsDivider { height: 1px; background: #e5e7eb; width: 100%; }

.teams--details {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  background: #fff;
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