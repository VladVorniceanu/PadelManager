<template>
  <UiModal :title="title" :subtitle="subtitle" @close="$emit('close')">
    <div class="matchDetailsGrid">
      <!-- LEFT -->
      <section class="matchDetailsCol">
        <UiCard>
          <div class="detailsLabel">Status</div>
          <div class="detailsValue detailsValue--sm">{{ statusLabel(match?.status) }}</div>
          <div class="detailsMeta">
            Start: <b>{{ fmt(match?.scheduledAt) }}</b><br />
            End: <b>{{ fmt(match?.endAt) }}</b>
          </div>
        </UiCard>

        <UiCard>
          <div class="detailsLabel">Teams</div>

                <div class="teamsEditor">
                  <div class="teamsEditor__col">
                    <div class="teamsEditor__head">Team 1</div>
                    <div class="teamsEditor__hint">Player 1 is always you.</div>

                    <div class="slotRow">
                      <div class="slotLabel">P1</div>
                      <PlayerSearchInput v-model="team1p1" :disabled="true" />
                    </div>

                    <div class="slotRow">
                      <div class="slotLabel">P2</div>
                      <PlayerSearchInput v-model="team1p2" :disabled="savingTeams" />
                    </div>
                  </div>

                  <div class="teamsEditor__divider" aria-hidden="true"></div>

                  <div class="teamsEditor__col">
                    <div class="teamsEditor__head">Team 2</div>

                    <div class="slotRow">
                      <div class="slotLabel">P1</div>
                      <PlayerSearchInput v-model="team2p1" :disabled="savingTeams" />
                    </div>

                    <div class="slotRow">
                      <div class="slotLabel">P2</div>
                      <PlayerSearchInput v-model="team2p2" :disabled="savingTeams" />
                    </div>
                  </div>
                </div>

          <div class="detailsActionsRow">
            <UiButton variant="subtle" type="button" :disabled="savingTeams" @click="resetTeams">Reset</UiButton>
            <UiButton variant="primary" type="button" :disabled="savingTeams" @click="saveTeams">
              {{ savingTeams ? 'Saving…' : 'Save teams' }}
            </UiButton>
          </div>

                <div v-if="teamsError" class="inlineError" style="margin-top: 10px;">
                  <div class="inlineErrorTitle">Teams update failed</div>
                  <div class="inlineErrorMsg">{{ teamsError }}</div>
                </div>
        </UiCard>
      </section>

            <!-- RIGHT -->
      <section class="matchDetailsCol">
        <UiCard>
          <div class="detailsLabel">Score</div>

                <div class="scoreEditor">
                  <div class="scoreGrid3">
                    <div v-for="(s, idx) in scoreSets" :key="`set-${idx}`" class="setCol">
                      <div class="setTitle">Set {{ idx + 1 }}</div>

                      <div class="setInputs">
                        <label class="setInputRow">
                          <span class="setTeam">T1</span>
                          <UiInput
                            size="small"
                            type="number"
                            number
                            min="0"
                            max="7"
                            v-model="s.t1"
                            :disabled="!canEditScore || savingScore"
                          />
                        </label>

                        <div class="setDash">—</div>

                        <label class="setInputRow">
                          <span class="setTeam">T2</span>
                          <UiInput
                            size="small"
                            type="number"
                            number
                            min="0"
                            max="7"
                            v-model="s.t2"
                            :disabled="!canEditScore || savingScore"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

          <UiNotice v-if="!canEditScore" style="margin-top: 10px;">
            Score can be edited only when the match is <b>COMPLETED</b>.
          </UiNotice>

          <div class="detailsActionsRow">
            <UiButton variant="subtle" :disabled="savingScore" @click="resetScore">Reset</UiButton>
            <UiButton variant="primary" :disabled="!canEditScore || savingScore" @click="saveScore">
              {{ savingScore ? 'Saving…' : 'Save score' }}
            </UiButton>
          </div>

                  <div v-if="scoreError" class="inlineError" style="margin-top: 10px;">
                    <div class="inlineErrorTitle">Score update failed</div>
                    <div class="inlineErrorMsg">{{ scoreError }}</div>
                  </div>
                </div>
        </UiCard>

        <div class="detailsActions">
          <UiButton type="button" @click="$emit('close')">Close</UiButton>
        </div>
      </section>
    </div>
  </UiModal>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { httpClient } from '@/api/httpClient';
import PlayerSearchInput from '@/components/common/PlayerSearchInput.vue';
import { useLookups } from '@/composables/useLookups';
import UiModal from '@/components/ui/UiModal.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiNotice from '@/components/ui/UiNotice.vue';
import UiInput from '@/components/ui/UiInput.vue';

const props = defineProps({
  match: { type: Object, required: true },
  locations: { type: Array, default: () => [] },
  myUid: { type: String, default: '' },
});

const emit = defineEmits(['close', 'updated']);

const { warmupLookups, courtNameById, userDisplayNameById, locationNameById } = useLookups();

function matchLocationId(m) {
  return m?.locationId || m?.location?.id || m?.reservation?.locationId || null;
}
function fmt(val) {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString();
}
function statusLabel(v) {
  const s = String(v || '').toLowerCase();
  if (s === 'scheduled') return 'Scheduled';
  if (s === 'ongoing') return 'Ongoing';
  if (s === 'completed') return 'Completed';
  if (s === 'cancelled') return 'Cancelled';
  return v || '—';
}

const title = computed(() => `Match at ${locationNameById(matchLocationId(props.match))}`);
const subtitle = computed(() => {
  const court = props.match?.courtId ? courtNameById(matchLocationId(props.match), props.match.courtId) : 'Court —';
  return `${fmt(props.match?.scheduledAt)} • ${court}`;
});

const canEditScore = computed(() => String(props.match?.status || '').toLowerCase() === 'completed');

/**
 * Teams draft
 */
const team1p1 = ref({ id: props.myUid, displayName: userDisplayNameById(props.myUid, { meUid: props.myUid }) });
const team1p2 = ref(null);
const team2p1 = ref(null);
const team2p2 = ref(null);

const savingTeams = ref(false);
const teamsError = ref('');

function uidToModel(uid) {
  if (!uid) return null;
  return typeof uid === 'string' ? { id: uid, displayName: userDisplayNameById(uid, { meUid: props.myUid }) } : uid;
}

function loadTeamsFromMatch(m) {
  const t1 = Array.isArray(m?.teams?.team1) ? m.teams.team1 : [props.myUid || null, null];
  const t2 = Array.isArray(m?.teams?.team2) ? m.teams.team2 : [null, null];

  team1p2.value = uidToModel(t1?.[1] || null);
  team2p1.value = uidToModel(t2?.[0] || null);
  team2p2.value = uidToModel(t2?.[1] || null);
}

function resetTeams() {
  teamsError.value = '';
  loadTeamsFromMatch(props.match);
}

function toUid(modelOrNull) {
  if (!modelOrNull) return null;
  if (typeof modelOrNull === 'string') return modelOrNull;
  return modelOrNull.id || modelOrNull.uid || null;
}

async function saveTeams() {
  teamsError.value = '';
  savingTeams.value = true;

  try {
    const payload = {
      teams: {
        team1: [toUid(team1p1.value), toUid(team1p2.value)],
        team2: [toUid(team2p1.value), toUid(team2p2.value)],
      },
    };

    const res = await httpClient.patch(`/matches/${props.match.id}`, payload);
    const updated = res?.data?.data ?? res?.data ?? res;

    emit('updated', updated);
  } catch (e) {
    console.error(e);
    teamsError.value = e?.response?.data?.message || e?.message || 'Failed to update teams.';
  } finally {
    savingTeams.value = false;
  }
}

/**
 * Score editor: always 3 sets
 */
const scoreSets = ref([
  { t1: 0, t2: 0 },
  { t1: 0, t2: 0 },
  { t1: 0, t2: 0 },
]);

const savingScore = ref(false);
const scoreError = ref('');

function normalizeScoreSets(m) {
  const sets = m?.score?.sets;
  if (!Array.isArray(sets)) return [];
  return sets.map((s) => ({ t1: Number(s?.t1 ?? 0), t2: Number(s?.t2 ?? 0) }));
}

function to3Sets(list) {
  const safe = Array.isArray(list) ? list : [];
  const out = [
    { t1: 0, t2: 0 },
    { t1: 0, t2: 0 },
    { t1: 0, t2: 0 },
  ];

  for (let i = 0; i < 3; i++) {
    const s = safe[i];
    if (!s) continue;
    out[i] = {
      t1: Number.isFinite(Number(s.t1)) ? Number(s.t1) : 0,
      t2: Number.isFinite(Number(s.t2)) ? Number(s.t2) : 0,
    };
  }
  return out;
}

function resetScore() {
  scoreError.value = '';
  scoreSets.value = to3Sets(normalizeScoreSets(props.match));
}

function computeWinnerTeam(sets) {
  let w1 = 0, w2 = 0;
  for (const s of sets) {
    if (Number(s.t1) > Number(s.t2)) w1++;
    else if (Number(s.t2) > Number(s.t1)) w2++;
  }
  if (w1 === w2) return null;
  return w1 > w2 ? 1 : 2;
}

async function saveScore() {
  scoreError.value = '';
  savingScore.value = true;

  try {
    const sets = to3Sets(scoreSets.value);

    const payload = {
      score: { sets },
      winnerTeam: computeWinnerTeam(sets),
      status: 'completed',
    };

    const res = await httpClient.patch(`/matches/${props.match.id}`, payload);
    const updated = res?.data?.data ?? res?.data ?? res;

    emit('updated', updated);
  } catch (e) {
    console.error(e);
    scoreError.value = e?.response?.data?.message || e?.message || 'Failed to update score.';
  } finally {
    savingScore.value = false;
  }
}

onMounted(() => {
  warmupLookups?.();
});

watch(
  () => props.match,
  (m) => {
    loadTeamsFromMatch(m);
    resetScore();
  },
  { immediate: true }
);
</script>

<style scoped>
.modalBody { padding: 16px; }

/* input small helper (poți muta în global dacă vrei) */
.input.small { padding: 8px 10px; }
</style>