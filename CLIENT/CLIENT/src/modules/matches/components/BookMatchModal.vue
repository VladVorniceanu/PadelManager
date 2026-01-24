<template>
  <UiModal
    v-if="modal.open"
    title="Book a match"
    subtitle="Pick location, court and an available time slot."
    modal-class="modal--wide"
    @close="close"
  >
    <div v-if="uiError" class="inlineError">
      <div class="inlineErrorTitle">Cannot create the reservation</div>
      <div class="inlineErrorMsg">{{ uiError }}</div>
    </div>

    <form class="form" @submit.prevent="submit">
      <div class="formGrid">
        <!-- Location -->
        <label class="field full">
          <div class="label">Location</div>
          <UiSelect v-model="form.locationId" :disabled="loadingLocations">
            <option value="" disabled>Select a location…</option>
            <option v-for="l in locationOptions" :key="l.id" :value="l.id">
              {{ l.name }} — {{ l.city }}
            </option>
          </UiSelect>
        </label>

        <!-- Court -->
        <label class="field full">
          <div class="label">Court</div>
          <UiSelect
            v-model="form.courtId"
            :disabled="!form.locationId || !courtsForSelected.length"
          >
            <option value="" disabled>
              {{ !form.locationId ? 'Pick a location first…' : 'Select a court…' }}
            </option>
            <option v-for="c in courtsForSelected" :key="c.id" :value="c.id">
              {{ c.label }}
            </option>
          </UiSelect>
        </label>

        <!-- Duration -->
        <div class="field full">
          <div class="label">Duration</div>
          <div class="durationPills" role="radiogroup" aria-label="Duration">
            <UiButton
              v-for="d in DURATIONS"
              :key="d"
              type="button"
              class="durationPill"
              :class="{ active: form.duration === d }"
              @click="form.duration = d"
            >
              {{ d }} min
            </UiButton>
          </div>
        </div>

        <!-- Date -->
        <label class="field full">
          <div class="label">Date</div>
          <UiInput v-model="form.dateLocal" type="date" />
        </label>

        <!-- Availability -->
        <div class="field full">
          <div class="label">Available times</div>

          <UiNotice v-if="!canLoadAvailability">
            Select <b>Location</b>, <b>Court</b>, <b>Duration</b> and <b>Date</b> to see available slots.
          </UiNotice>

          <div v-else>
            <UiStateCard v-if="loadingAvail" variant="loading" :lines="2" style="padding: 12px;" />

            <UiNotice v-else-if="!(filteredSlots.length)">
              No available slots for this day. Try another date or duration.
            </UiNotice>

            <div v-else class="slotsGrid" role="list">
              <UiButton v-for="s in (availability?.slots || [])" :key="s.startAt"
                class="slotBtn"
                :class="{ active: form.startAt === s.startAt }"
                @click="pickSlot(s)"
              >
                {{ s.label }}
              </UiButton>
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

              <div class="slotRow">
                <div class="slotLabel">P1</div>
                <PlayerSearchInput :disabled="true" :modelValue="team1p1.displayName" />
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
            <div class="teamsEditor__hint">Player 1 is always you. You can add/modify players later too. Empty slots are allowed.</div>
          </div>
        </div>
      </div>

      <div class="modalActions">
        <UiButton variant="subtle" @click="close">Cancel</UiButton>
        <UiButton variant="primary" type="submit" :disabled="saving || !canSubmit">
          {{ saving ? 'Saving…' : 'Create reservation' }}
        </UiButton>
      </div>
    </form>

    <UiCard v-if="successMsg" style="margin: 0 16px 16px;">
      <b>Done!</b> {{ successMsg }}
    </UiCard>
  </UiModal>
</template>


<script setup>
import UiModal from '@/components/ui/UiModal.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiNotice from '@/components/ui/UiNotice.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';
import UiCard from '@/components/ui/UiCard.vue';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '@/services/firebase';

import PlayerSearchInput from '@/components/common/PlayerSearchInput.vue';
import { useBookMatchModalStore } from '@/modules/matches/store/useBookMatchModalStore';
import { fetchLocations } from '@/api/locationsApi';
import { createReservation, getCourtAvailability } from '@/api/reservationsApi';

const router = useRouter();
const modal = useBookMatchModalStore();
const authStore = useAuthStore();

const DURATIONS = [60, 90, 120];
const nowMs = ref(Date.now());
let nowTimer = null;

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

const team1p1 = computed(() => {
  const u = authStore.displayName? { id: auth.currentUser?.uid, displayName: authStore.displayName } : null;
  return u;
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

const filteredSlots = computed(() => {
  const list = Array.isArray(availability.value?.slots) ? availability.value.slots : [];
  const now = nowMs.value;
  return list.filter((s) => {
    const t = new Date(s.startAt).getTime();
    return Number.isFinite(t) && t >= now;
  })
});

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
    if (nowTimer) clearInterval(nowTimer);
    nowTimer = setInterval(() => {
      nowMs.value = Date.now();
      if (form.startAt && !filteredSlots.value.some((s) => s.startAt === form.startAt)) {
        clearPickedSlot();
      }
    }, 30_000);
    resetEphemeral();
    await loadLocationsOnce(); // warmup exists in MainLayout, but keep as fail-safe
    resetForm();
    await loadAvailability();
  }
);

// Close: cleanup timer
watch(
  () => modal.open,
  (isOpen) => {
    if (isOpen) return;
    if (nowTimer) {
      clearInterval(nowTimer);
      nowTimer = null;
    }
  }
);

onBeforeUnmount(() => {
  if (nowTimer) clearInterval(nowTimer);
});

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