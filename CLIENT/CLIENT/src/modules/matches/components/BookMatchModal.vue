<template>
  <teleport to="body">
    <div v-if="modal.open" class="backdrop" @click.self="close">
      <div class="modal modal--wide" role="dialog" aria-modal="true">
        <div class="modalHeader">
          <div>
            <div class="modalTitle">Book a match</div>
            <div class="modalSubtitle">Pick location, court and an available time slot.</div>
          </div>
          <button class="iconBtn" type="button" @click="close" aria-label="Close">✕</button>
        </div>

        <div v-if="uiError" class="inlineError">
          <div class="inlineErrorTitle">Nu putem crea rezervarea</div>
          <div class="inlineErrorMsg">{{ uiError }}</div>
        </div>

        <form class="form" @submit.prevent="submit">
          <div class="formGrid">
            <!-- Location -->
            <label class="field full">
              <div class="label">Location</div>
              <select v-model="form.locationId" class="select" :disabled="loadingLocations">
                <option value="" disabled>Select a location…</option>
                <option v-for="l in locationOptions" :key="l.id" :value="l.id">
                  {{ l.name }} — {{ l.city }}
                </option>
              </select>
            </label>

            <!-- Court -->
            <label class="field full">
              <div class="label">Court</div>
              <select
                v-model="form.courtId"
                class="select"
                :disabled="!form.locationId || !courtsForSelected.length"
              >
                <option value="" disabled>
                  {{ !form.locationId ? 'Pick a location first…' : 'Select a court…' }}
                </option>
                <option v-for="c in courtsForSelected" :key="c.id" :value="c.id">
                  {{ c.label }}
                </option>
              </select>
            </label>

            <!-- Duration -->
            <div class="field full">
              <div class="label">Duration</div>
              <div class="durationPills" role="radiogroup" aria-label="Duration">
                <button
                  v-for="d in DURATIONS"
                  :key="d"
                  type="button"
                  class="durationPill"
                  :class="{ active: form.duration === d }"
                  @click="form.duration = d"
                >
                  {{ d }} min
                </button>
              </div>
            </div>

            <!-- Date -->
            <label class="field full">
              <div class="label">Date</div>
              <input v-model="form.dateLocal" class="input" type="date" />
            </label>

            <!-- Availability -->
            <div class="field full">
              <div class="label">Available times</div>

              <div v-if="!canLoadAvailability" class="inlineNotice">
                Select <b>Location</b>, <b>Court</b>, <b>Duration</b> and <b>Date</b> to see available slots.
              </div>

              <div v-else>
                <div v-if="loadingAvail" class="card" style="padding: 12px;">
                  <div class="skeletonLine"></div>
                  <div class="skeletonLine"></div>
                </div>

                <div v-else-if="!(availability?.slots?.length)" class="inlineNotice">
                  No available slots for this day. Try another date or duration.
                </div>

                <div v-else class="slotsGrid" role="list">
                  <button v-for="s in (availability?.slots || [])" :key="s.startAt"
                    type="button"
                    class="slotBtn"
                    :class="{ active: form.startAt === s.startAt }"
                    @click="pickSlot(s)"
                  >
                    {{ s.label }}
                  </button>
                </div>

                <div v-if="form.startAt && form.endAt" class="pickedHint">
                  Selected: <b>{{ pickedLabel }}</b> ({{ form.duration }} min)
                </div>
              </div>
            </div>

            <!-- Players -->
            <div class="field full">
              <div class="label">Players</div>

              <div class="teamsEditor">
                <div class="teamsEditor__col">
                  <div class="teamsEditor__head">Team 1</div>
                  <div class="teamsEditor__hint">Player 1 is always you.</div>

                  <div class="slotRow">
                    <div class="slotLabel">P1</div>
                    <div class="pill strong">Me</div>
                  </div>

                  <div class="slotRow">
                    <div class="slotLabel">P2</div>
                    <PlayerSearchInput v-model="team1p2" />
                  </div>
                </div>

                <div class="teamsEditor__divider" aria-hidden="true"></div>

                <div class="teamsEditor__col">
                  <div class="teamsEditor__head">Team 2</div>

                  <div class="slotRow">
                    <div class="slotLabel">P1</div>
                    <PlayerSearchInput v-model="team2p1" />
                  </div>

                  <div class="slotRow">
                    <div class="slotLabel">P2</div>
                    <PlayerSearchInput v-model="team2p2" />
                  </div>
                </div>
              </div>

              <div class="teamsHint">
                You can add/modify players later too. Empty slots are allowed.
              </div>
            </div>
          </div>

          <div class="modalActions">
            <button class="btn" type="button" @click="close">Cancel</button>
            <button class="btn primary" type="submit" :disabled="saving || !canSubmit">
              {{ saving ? 'Saving…' : 'Create reservation' }}
            </button>
          </div>
        </form>

        <div v-if="successMsg" class="card" style="margin: 0 16px 16px;">
          <b>Done!</b> {{ successMsg }}
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '@/services/firebase';

import PlayerSearchInput from '@/components/common/PlayerSearchInput.vue';
import { useBookMatchModalStore } from '@/modules/matches/store/useBookMatchModalStore';
import { fetchLocations } from '@/api/locationsApi';
import { createReservation, getCourtAvailability } from '@/api/reservationsApi';

const router = useRouter();
const modal = useBookMatchModalStore();

const DURATIONS = [60, 90, 120];

const loadingLocations = ref(false);
const locations = ref([]);

const loadingAvail = ref(false);
const availability = ref({ slots: [] });

const saving = ref(false);
const uiError = ref(null);
const successMsg = ref('');

// "request version" to ignore stale availability responses
let availabilityReqId = 0;

const form = reactive({
  locationId: '',
  courtId: '',
  duration: 90,
  dateLocal: '',
  startAt: '', // ISO
  endAt: '',   // ISO
});

const team1p2 = ref(null);
const team2p1 = ref(null);
const team2p2 = ref(null);

function resetEphemeral() {
  uiError.value = null;
  successMsg.value = '';
}

function resetForm() {
  form.locationId = modal.locationId || '';
  form.courtId = '';
  form.duration = 90;
  form.dateLocal = defaultDateLocal();
  form.startAt = '';
  form.endAt = '';

  team1p2.value = null;
  team2p1.value = null;
  team2p2.value = null;

  availability.value = { slots: [] };
}

function close() {
  resetEphemeral();
  modal.closeModal();
}

function defaultDateLocal() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

async function loadLocationsOnce() {
  if (locations.value?.length) return;
  loadingLocations.value = true;
  try {
    locations.value = (await fetchLocations()) || [];
  } catch (e) {
    // fail-safe: allow modal to open; show error only if user needs it
    console.error(e);
  } finally {
    loadingLocations.value = false;
  }
}

const locationOptions = computed(() =>
  [...(locations.value || [])].sort((a, b) =>
    String(a?.name || '').localeCompare(String(b?.name || ''), 'ro')
  )
);

const selectedLocation = computed(() =>
  (locations.value || []).find((x) => x.id === form.locationId)
);

const courtsForSelected = computed(() => {
  const l = selectedLocation.value;
  const raw = l?.courts || [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((c, idx) => {
      if (typeof c === 'string') return { id: c, label: c };
      const id = c?.id || c?.courtId || `${idx + 1}`;
      const label = c?.name || c?.label || `Court ${idx + 1}`;
      return { id, label };
    })
    .filter(Boolean);
});

const canLoadAvailability = computed(() =>
  Boolean(form.locationId && form.courtId && form.dateLocal && DURATIONS.includes(form.duration))
);

function clearPickedSlot() {
  form.startAt = '';
  form.endAt = '';
}

async function loadAvailability() {
  if (!canLoadAvailability.value) {
    availability.value = { slots: [] };
    return;
  }

  const myReq = ++availabilityReqId;
  loadingAvail.value = true;

  try {

    const res = await getCourtAvailability({
      courtId: form.courtId,
      date: form.dateLocal,
      duration: form.duration,
    });

    // ignore stale response
    if (myReq !== availabilityReqId) return;

    availability.value = res && Array.isArray(res.slots) ? res : { slots: [] };

    // if user had selected a slot that no longer exists, clear it
    if (form.startAt && !availability.value.slots.some((s) => s.startAt === form.startAt)) {
      clearPickedSlot();
    }
  } catch (e) {
    console.error(e);
    if (myReq !== availabilityReqId) return;
    availability.value = { slots: [] };
  } finally {
    if (myReq === availabilityReqId) loadingAvail.value = false;
  }
}

function pickSlot(s) {
  form.startAt = s.startAt;
  form.endAt = s.endAt;
}

const pickedLabel = computed(() => {
  const s = availability.value?.slots?.find((x) => x.startAt === form.startAt);
  return s?.label || '—';
});

const canSubmit = computed(() =>
  Boolean(form.locationId && form.courtId && form.startAt && form.endAt)
);

// ---- Watchers (minimal + deterministic) ----

// Open: init + ensure we have locations + load availability (if possible)
watch(
  () => modal.open,
  async (isOpen) => {
    if (!isOpen) return;

    resetEphemeral();
    await loadLocationsOnce(); // warmup exists in MainLayout, but keep as fail-safe
    resetForm();
    await loadAvailability();
  }
);

// When location changes: reset dependent fields
watch(
  () => form.locationId,
  () => {
    form.courtId = '';
    availability.value = { slots: [] };
    clearPickedSlot();
  }
);

// When any availability input changes: reload availability
watch(
  () => [form.courtId, form.dateLocal, form.duration],
  async () => {
    availability.value = { slots: [] };
    clearPickedSlot();
    await loadAvailability();
  }
);

// ---- Submit ----

function toUid(userOrNull) {
  if (!userOrNull) return null;
  if (typeof userOrNull === 'string') return userOrNull;
  return userOrNull.id || userOrNull.uid || null;
}

async function submit() {
  resetEphemeral();

  if (!canSubmit.value) {
    uiError.value = 'Selectează un slot disponibil.';
    return;
  }

  const uid = auth.currentUser?.uid || null;
  if (!uid) {
    uiError.value = 'Trebuie să fii logat.';
    return;
  }

  saving.value = true;
  try {
    const payload = {
      locationId: form.locationId,
      courtId: form.courtId,
      startAt: form.startAt,
      endAt: form.endAt,
      teams: {
        team1: [uid, toUid(team1p2.value)],
        team2: [toUid(team2p1.value), toUid(team2p2.value)],
      },
    };

    await createReservation(payload);

    // notify + close
    window.dispatchEvent(new CustomEvent('pm:reservation-created', { detail: payload }));
    close();

    // optional navigation (keep simple + safe)
    const path = router.currentRoute.value?.path || '';
    if (!(path === '/' || path.startsWith('/friendly') || path.startsWith('/matches'))) {
      await router.push({ name: 'home' }).catch(() => {});
    }
  } catch (e) {
    console.error(e);
    uiError.value = e?.response?.data?.message || e?.message || 'Operation failed.';
  } finally {
    saving.value = false;
  }
}

onMounted(loadLocationsOnce);
</script>

<style scoped>
/* ✅ păstrăm în componentă DOAR dimensiunea specială a modalului */
.modal--wide {
  width: min(1200px, 96vw);
}
</style>