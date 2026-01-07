<template>
  <teleport to="body">
    <div v-if="modal.open" class="backdrop" @click.self="close">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modalHeader">
          <div>
            <div class="modalTitle">Book a match</div>
            <div class="modalSubtitle">Creează o rezervare (și implicit un meci).</div>
          </div>
          <button class="iconBtn" type="button" @click="close" aria-label="Close">✕</button>
        </div>

        <div v-if="uiError" class="inlineError">
          <div class="inlineErrorTitle">Nu putem crea rezervarea</div>
          <div class="inlineErrorMsg">{{ uiError }}</div>
        </div>

        <form class="form" @submit.prevent="submit">
          <div class="formGrid">
            <label class="field full">
              <div class="label">Location</div>
              <select v-model="form.locationId" class="select" :disabled="loadingLocations">
                <option value="" disabled>Select a location…</option>
                <option v-for="l in locationOptions" :key="l.id" :value="l.id">
                  {{ l.name }} — {{ l.city }}
                </option>
              </select>
            </label>

            <label class="field full">
              <div class="label">Court</div>
              <select v-model="form.courtId" class="select" :disabled="!courtsForSelected.length">
                <option value="" disabled>
                  {{ !form.locationId ? 'Pick a location first…' : 'Select a court…' }}
                </option>
                <option v-for="c in courtsForSelected" :key="c.id" :value="c.id">
                  {{ c.label }}
                </option>
              </select>
            </label>

            <label class="field">
              <div class="label">Start</div>
              <input v-model="form.startAtLocal" class="input" type="datetime-local" />
            </label>

            <label class="field">
              <div class="label">End</div>
              <input v-model="form.endAtLocal" class="input" type="datetime-local" />
            </label>
          </div>

          <div class="modalActions">
            <button class="btn" type="button" @click="close">Cancel</button>
            <button class="btn primary" type="submit" :disabled="saving">
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
import { useBookMatchModalStore } from '../store/useBookMatchModalStore';
import { fetchLocations } from '../../../api/locationsApi';
import { createReservation } from '../../../api/reservationsApi';
import { useRouter } from 'vue-router';

const router = useRouter();

const modal = useBookMatchModalStore();

const loadingLocations = ref(false);
const locations = ref([]);

const saving = ref(false);
const uiError = ref(null);
const successMsg = ref('');

const form = reactive({
  locationId: '',
  courtId: '',
  startAtLocal: '',
  endAtLocal: '',
});

function close() {
  uiError.value = null;
  successMsg.value = '';
  modal.closeModal();
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

function toIsoOrNull(datetimeLocal) {
  if (!datetimeLocal) return null;
  const d = new Date(datetimeLocal);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function loadLocationsOnce() {
  if (locations.value?.length) return;
  loadingLocations.value = true;
  try {
    locations.value = (await fetchLocations()) || [];
  } finally {
    loadingLocations.value = false;
  }
}

// when modal opens, apply optional prefill + defaults
watch(
  () => modal.open,
  async (isOpen) => {
    if (!isOpen) return;

    uiError.value = null;
    successMsg.value = '';

    await loadLocationsOnce();

    form.locationId = modal.locationId || form.locationId || '';
    form.courtId = '';

    // defaults: now+1h, +2h
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const toLocalInput = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    form.startAtLocal = toLocalInput(start);
    form.endAtLocal = toLocalInput(end);
  }
);

watch(
  () => form.locationId,
  () => {
    form.courtId = '';
  }
);

async function submit() {
  uiError.value = null;
  successMsg.value = '';

  if (!form.locationId) {
    uiError.value = 'Selectează o locație.';
    return;
  }
  if (!form.courtId) {
    uiError.value = 'Selectează un teren.';
    return;
  }

  const startAt = toIsoOrNull(form.startAtLocal);
  const endAt = toIsoOrNull(form.endAtLocal);
  if (!startAt || !endAt) {
    uiError.value = 'Datele sunt invalide. Alege Start/End.';
    return;
  }

  saving.value = true;
  try {
    await createReservation({
      locationId: form.locationId,
      courtId: form.courtId,
      startAt,
      endAt,
      tournamentId: null,
    });

    successMsg.value = 'Reservation created successfully.';

    // ✅ notify pages that care about it
    const path = router.currentRoute.value?.path || '';
    const shouldRefreshHere = path === '/' || path.startsWith('/friendly');

    if (shouldRefreshHere) {
      window.dispatchEvent(new CustomEvent('pm:reservation-created', {
        detail: { locationId: form.locationId, courtId: form.courtId, startAt, endAt }
      }));
      close();
      return;
    }

    // otherwise: go home
    close();
    await router.push({ name: 'home' }).catch(() => {});
    
  } catch (e) {
    uiError.value = e?.response?.data?.message || e?.message || 'Operation failed.';
  } finally {
    saving.value = false;
  }
}

onMounted(loadLocationsOnce);
</script>