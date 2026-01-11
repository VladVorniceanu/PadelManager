<template>
  <section class="wrap">
    <header class="header">
      <div class="headLeft">
        <h2 class="title">Tournaments</h2>
        <p class="subtitle">Admin: creează și gestionează turnee.</p>
      </div>

      <div class="headRight">
        <UiButton variant="primary"  @click="openCreate">+ Add tournament</UiButton>
      </div>
    </header>

    <UiStateCard v-if="store.loading" variant="loading" :lines="3" />

    <UiStateCard v-else-if="store.error" variant="error" title="Eroare" :message="store.error">
      <template #action>
        <UiButton @click="store.load">Retry</UiButton>
      </template>
    </UiStateCard>

    <UiStateCard
      v-else-if="!store.items.length"
      variant="empty"
      title="Nu există turnee încă."
      message="Apasă “Add tournament” ca să creezi primul turneu."
    >
      <template #action>
        <UiButton variant="primary" @click="openCreate">+ Add tournament</UiButton>
      </template>
    </UiStateCard>

    <div v-else class="grid">
      <article v-for="t in store.items" :key="t.id" class="locCard">
        <div class="locHead">
          <div class="locIdentity">
            <div class="locNameRow">
              <div class="locName">{{ t.name }}</div>
                <UiPill>{{ statusLabel(t.status) }}</UiPill>
            </div>

            <div class="locMeta">
              <span class="metaItem">
                📍
                <template v-if="locationsStore.loading">Loading…</template>
                <template v-else>{{ locationPreview(t.locationId) }}</template>
              </span>
              <span class="dot">•</span>
              <span class="metaItem">🗓 {{ formatDate(t.startDate) }} → {{ formatDate(t.endDate) }}</span>
            </div>
          </div>

          <div class="actions">
            <UiButton  @click="openEdit(t)">Edit</UiButton>
            <UiButton variant="danger"  @click="confirmDelete(t)">Delete</UiButton>
          </div>
        </div>

        <div class="locBody">
          <div class="timestamps" v-if="t.createdAt || t.updatedAt">
            <div v-if="t.createdAt">Created: <span>{{ formatDateTime(t.createdAt) }}</span></div>
            <div v-if="t.updatedAt">Updated: <span>{{ formatDateTime(t.updatedAt) }}</span></div>
          </div>
        </div>
      </article>
    </div>

    <!-- Modal create/edit -->
    <UiModal
      v-if="modal.open"
      :title="modal.mode === 'create' ? 'Add tournament' : 'Edit tournament'"
      subtitle="Completează detaliile turneului."
      @close="closeModal"
    >

        <div v-if="uiError" class="inlineError">
          <div class="inlineErrorTitle">Nu putem salva</div>
          <div class="inlineErrorMsg">{{ uiError }}</div>
        </div>

        <form class="form" @submit.prevent="submit">
          <div class="formGrid">
            <label class="field full">
              <div class="label">Name</div>
              <UiInput v-model.trim="form.name"  :class="{ invalid: !!fieldErrors.name }" />
              <div v-if="fieldErrors.name" class="fieldError">{{ fieldErrors.name }}</div>
            </label>

            <label class="field full">
              <div class="label">Location</div>
              <UiSelect
                v-model="form.locationId"
                
                :class="{ invalid: !!fieldErrors.locationId }"
              >
                <option value="" disabled>Select a location…</option>
                <option v-for="l in locationOptions" :key="l.id" :value="l.id">
                  {{ l.name }} — {{ l.city }}
                </option>
              </UiSelect>
              <div v-if="fieldErrors.locationId" class="fieldError">{{ fieldErrors.locationId }}</div>
            </label>

            <label class="field">
              <div class="label">Start date</div>
              <UiInput v-model="form.startDate"  type="date" />
            </label>

            <label class="field">
              <div class="label">End date</div>
              <UiInput v-model="form.endDate"  type="date" />
            </label>
 -->
          </div>

          <div class="modalActions">
            <UiButton type="button"  @click="closeModal">Cancel</UiButton>
            <UiButton variant="primary" type="submit"  :disabled="saving">
              {{ saving ? 'Saving…' : 'Save' }}
            </UiButton>
          </div>
        </form>
    </UiModal>

    <!-- Confirm delete -->
    <UiModal v-if="confirm.open" title="Confirm delete" @close="confirm.open = false">
      <div class="confirmMsg">
        Ștergi turneul <b>{{ confirm.name }}</b>? Acțiunea este ireversibilă.
      </div>

      <div class="confirmActions" style="margin-top: 12px;">
        <UiButton variant="subtle" @click="confirm.open = false">Cancel</UiButton>
        <UiButton variant="danger" :disabled="confirm.busy" @click="doDelete">
          {{ confirm.busy ? 'Deleting…' : 'Delete' }}
        </UiButton>
      </div>
    </UiModal>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiPill from '@/components/ui/UiPill.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiModal from '@/components/ui/UiModal.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';

import { useAdminTournamentsStore } from '../store/useAdminTournamentsStore';
import { useAdminLocationsStore } from '../store/useAdminLocationsStore';

const locationsStore = useAdminLocationsStore();
const store = useAdminTournamentsStore();

const saving = ref(false);
const uiError = ref(null);

const modal = reactive({ open: false, mode: 'create', editId: null });
const confirm = reactive({ open: false, id: null, name: '', busy: false });

const form = reactive({
  name: '',
  locationId: '',
  startDate: '',
  endDate: '',
  status: 'draft',
});

const fieldErrors = reactive({
  name: '',
  locationId: '',
});

const locationOptions = computed(() => {
  const items = Array.isArray(locationsStore.items) ? locationsStore.items : [];
  return [...items].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ro'));
});

function locationPreview(locationId) {
  if (!locationId) return '—';

  const loc = locationsStore.items?.find((x) => x.id === locationId);
  if (!loc) return `Unknown location (${locationId})`;

  const name = loc.name || '—';
  const city = loc.city ? ` — ${loc.city}` : '';
  return `${name}${city}`;
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'running', label: 'Running' },
  { value: 'finished', label: 'Finished' },
];

onMounted(async () => {
  await Promise.all([
    store.load(),
    (Array.isArray(locationsStore.items) && locationsStore.items.length)
      ? Promise.resolve()
      : locationsStore.load()  
  ]);
});

function statusLabel(value) {
  return statusOptions.find((s) => s.value === value)?.label || (value ? value[0].toUpperCase() + value.slice(1) : '—');
}

function openCreate() {
  uiError.value = null;
  fieldErrors.name = '';
  fieldErrors.locationId = '';
  modal.open = true;
  modal.mode = 'create';
  modal.editId = null;

  form.name = '';
  form.locationId = '';
  form.startDate = '';
  form.endDate = '';
  form.status = 'draft';
}

function openEdit(t) {
  uiError.value = null;
  fieldErrors.name = '';
  fieldErrors.locationId = '';
  modal.open = true;
  modal.mode = 'edit';
  modal.editId = t.id;

  form.name = t.name || '';
  form.locationId = t.locationId || '';
  form.startDate = t.startDate || '';
  form.endDate = t.endDate || '';
  form.status = t.status || 'draft';
}

function closeModal() {
  modal.open = false;
  uiError.value = null;
}

function validate() {
  fieldErrors.name = '';
  fieldErrors.locationId = '';
  let ok = true;

  if (!form.name || form.name.trim().length < 2) { fieldErrors.name = 'Name must have at least 2 characters.'; ok = false; }
  if (!form.locationId) { fieldErrors.locationId = 'locationId is required.'; ok = false; }

  return ok;
}

async function submit() {
  uiError.value = null;
  if (!validate()) return;

  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      locationId: form.locationId.trim(),
      startDate: form.startDate?.trim() || null,
      endDate: form.endDate?.trim() || null,
      status: form.status,
    };

    if (modal.mode === 'create') await store.create(payload);
    else await store.update(modal.editId, payload);

    closeModal();
  } catch (e) {
    uiError.value = store.error || e?.response?.data?.message || 'Operation failed';
  } finally {
    saving.value = false;
  }
}

function confirmDelete(t) {
  confirm.open = true;
  confirm.id = t.id;
  confirm.name = t.name || '—';
  confirm.busy = false;
}

async function doDelete() {
  confirm.busy = true;
  try {
    await store.delete(confirm.id);
    confirm.open = false;
  } finally {
    confirm.busy = false;
  }
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
</script>