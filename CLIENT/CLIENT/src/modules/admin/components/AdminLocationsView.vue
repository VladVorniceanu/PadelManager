<template>
  <section class="wrap">
    <!-- Header -->
    <header class="header">
      <div class="headLeft">
        <h2 class="title">Locations</h2>
        <p class="subtitle">Manage locations and courts.</p>
      </div>

      <div class="headRight">
        <div class="searchWrap">
          <UiInput
            v-model.trim="q"
            class="search"
            type="text"
            placeholder="⌕ Search by name / city / address…"
          />
          <UiButton v-if="q" class="clearBtn" @click="q = ''" aria-label="Clear search">
            ✕
          </UiButton>
        </div>

        <UiSelect 
          v-model="sortBy" 
          aria-label="Sort"
          size="md">
          <option value="name">Sort: Name</option>
          <option value="city">Sort: City</option>
          <option value="courts">Sort: Courts</option>
          <option value="updatedAt">Sort: Updated</option>
        </UiSelect>

        <UiButton variant="primary" @click="openCreate">
          + Add location
        </UiButton>
      </div>
    </header>

    <!-- States -->
    <UiStateCard v-if="store.loading" variant="loading" :lines="3" />

    <UiStateCard v-else-if="store.error" variant="error" title="Error" :message="store.error">
      <template #action>
        <UiButton @click="store.load">Retry</UiButton>
      </template>
    </UiStateCard>

    <UiStateCard
      v-else-if="!filteredAndSorted.length"
      variant="empty"
      title="No locations found (or the filter matches nothing)."
      message="Try clearing the search or click “+ Add location”."
    >
      <template #action>
        <div class="emptyActions">
          <UiButton variant="subtle" @click="q = ''">Clear search</UiButton>
          <UiButton variant="primary" @click="openCreate">+ Add location</UiButton>
        </div>
      </template>
    </UiStateCard>

    <!-- Grid -->
    <div v-else class="grid">
      <UiCard 
        v-for="loc in filteredAndSorted" 
        :key="loc.id"
        as="article"
        :interactive="true"
      >
        <template #title>
          {{ loc.name || '—' }}
        </template>
        <template #titleRight>
          <UiPill>{{ (loc.courts?.length ?? 0) }} courts</UiPill>
        </template>

        <template #left>
          <span class="metaItem">📍 {{ loc.city || '—' }} — {{ loc.address || '—' }}</span>
          <div class="bottom-aligned">
            <div class="timestamps" v-if="loc.createdAt || loc.updatedAt">
              <div v-if="loc.createdAt">Created: <span>{{ formatDate(loc.createdAt) }}</span></div>
              <div v-if="loc.updatedAt">Updated: <span>{{ formatDate(loc.updatedAt) }}</span></div>
            </div>
          </div>
        </template>

        <template #right>
          <div class="actions">
            <UiButton variant="subtle"  @click="openEdit(loc)">
              Manage Location →
            </UiButton>
            <UiButton variant="danger"  @click="confirmDelete(loc)">
              Delete
            </UiButton>
          </div>
        </template>
      </UiCard>
    </div>

    <!-- MODAL -->
    <UiModal
      v-if="modal.open"
      :title="modal.mode === 'create' ? 'Add location' : 'Edit location'"
      :subtitle="modal.mode === 'create'
        ? 'Fill in the location details.'
        : 'Edit the details and manage the courts.'"
      @close="closeModal"
    >

        <!-- Errors -->
        <div v-if="uiError" class="inlineError">
          <div class="inlineErrorTitle">Cannot save</div>
          <div class="inlineErrorMsg">{{ uiError }}</div>
        </div>

        <form class="form" @submit.prevent="submit">
          <!-- Location fields -->
          <div class="sectionTitle">Location details</div>

          <div class="formGrid">
            <label class="field">
              <div class="label">Name</div>
              <UiInput
                v-model.trim="form.name"
                
                type="text"
                placeholder="Ex: Magic Padel"
                :class="{ invalid: !!fieldErrors.name }"
              />
              <div v-if="fieldErrors.name" class="fieldError">{{ fieldErrors.name }}</div>
            </label>

            <label class="field">
              <div class="label">City</div>
              <UiInput
                v-model.trim="form.city"
                
                type="text"
                placeholder="Ex: Bucharest"
                :class="{ invalid: !!fieldErrors.city }"
              />
              <div v-if="fieldErrors.city" class="fieldError">{{ fieldErrors.city }}</div>
            </label>

            <label class="field full">
              <div class="label">Address</div>
              <UiInput
                v-model.trim="form.address"
                
                type="text"
                placeholder="Ex: Strada Exemplu 123"
                :class="{ invalid: !!fieldErrors.address }"
              />
              <div v-if="fieldErrors.address" class="fieldError">{{ fieldErrors.address }}</div>
            </label>
          </div>

          <div class="divider"></div>

          <!-- Courts only in edit mode -->
          <div v-if="modal.mode === 'edit'" class="courtsWrap">
            <div class="courtsHeader">
              <div>
                <div class="sectionTitle">Courts</div>
                <div class="sectionHint">
                  Add / edit courts for this location.
                </div>
              </div>
              <UiPill strong>{{ courts.length }} total</UiPill>
            </div>

            <!-- Add court -->
            <div class="courtAddRow">
              <label class="field grow">
                <div class="label">Court name</div>
                <UiInput
                  v-model.trim="courtForm.name"
                  
                  type="text"
                  placeholder="Ex: Court 1"
                  :class="{ invalid: !!courtErrors.name }"
                />
                <div v-if="courtErrors.name" class="fieldError">{{ courtErrors.name }}</div>
              </label>

              <label class="toggle">
                <input type="checkbox" v-model="courtForm.isIndoor" />
                <span>Indoor</span>
              </label>

              <UiButton variant="primary"
                type="button"
                
                :disabled="courtBusy"
                @click="onAddCourt"
              >
                {{ courtBusy ? 'Adding…' : '+ Add' }}
              </UiButton>
            </div>

            <UiNotice v-if="courtError">{{ courtError }}</UiNotice>

            <!-- Courts list -->
            <div v-if="courts.length === 0" class="courtsEmpty">
              No courts added yet.
            </div>

            <div v-else class="courtsList">
              <div class="courtRow" v-for="c in courtsDraft" :key="c.id">
                <div class="courtLeft">
                  <UiInput v-model.trim="c.name"  placeholder="Court name" />
                  <label class="toggle smallToggle">
                    <input type="checkbox" v-model="c.isIndoor" />
                    <span>Indoor</span>
                  </label>
                </div>

                <div class="courtRight">
                  <UiButton
                    type="button"
                    
                    :disabled="courtBusy || !isCourtDirty(c.id)"
                    @click="onSaveCourt(c)"
                    title="Save changes"
                  >
                    Save
                  </UiButton>
                  <UiButton variant="danger"
                    type="button"
                    
                    :disabled="courtBusy"
                    @click="onDeleteCourt(c)"
                    title="Delete court"
                  >
                    Delete
                  </UiButton>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="modalActions">
            <UiButton type="button"  @click="closeModal">Cancel</UiButton>
            <UiButton variant="primary" type="submit"  :disabled="saving">
              {{ saving ? 'Saving…' : 'Save location' }}
            </UiButton>
          </div>
        </form>
    </UiModal>

    <!-- Delete confirm -->
    <UiModal v-if="confirm.open" title="Confirm delete" @close="confirm.open = false">
      <div class="confirmMsg">
        Delete location <b>{{ confirm.name }}</b>? This action is irreversible.
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiPill from '@/components/ui/UiPill.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiModal from '@/components/ui/UiModal.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';
import UiNotice from '@/components/ui/UiNotice.vue';

import { useAdminLocationsStore } from '../store/useAdminLocationsStore';
import { addCourt, updateCourt, deleteCourt } from '../../../api/locationsApi';

const store = useAdminLocationsStore();

const saving = ref(false);
const uiError = ref(null);

const q = ref('');
const sortBy = ref('updatedAt'); // default: updated first

const modal = reactive({
  open: false,
  mode: 'create', // 'create' | 'edit'
  editId: null,
  editLoc: null,
});

const confirm = reactive({
  open: false,
  id: null,
  name: '',
  busy: false,
});

const form = reactive({
  name: '',
  city: '',
  address: '',
});

const fieldErrors = reactive({
  name: '',
  city: '',
  address: '',
});

// Courts state (only in edit mode)
const courtBusy = ref(false);
const courtError = ref(null);

const courtForm = reactive({
  name: '',
  isIndoor: false,
});

const courtErrors = reactive({
  name: '',
});

// Draft list for edits (so we can detect dirty changes)
const courtsDraft = ref([]);
const courtsOriginalSnapshot = ref(new Map()); // courtId -> JSON string

const courts = computed(() => modal.editLoc?.courts ?? []);

onMounted(async () => {
  await store.load();
});

const filteredAndSorted = computed(() => {
  const items = Array.isArray(store.items) ? store.items : [];
  const query = q.value.trim().toLowerCase();

  const filtered = !query
    ? items
    : items.filter((l) => {
        const s = `${l.name || ''} ${l.city || ''} ${l.address || ''}`.toLowerCase();
        return s.includes(query);
      });

  const copy = [...filtered];

  copy.sort((a, b) => {
    if (sortBy.value === 'courts') {
      return (b.courts?.length ?? 0) - (a.courts?.length ?? 0);
    }
    if (sortBy.value === 'updatedAt') {
      return dateValue(b.updatedAt || b.createdAt) - dateValue(a.updatedAt || a.createdAt);
    }
    if (sortBy.value === 'city') {
      return String(a.city || '').localeCompare(String(b.city || ''), 'ro');
    }
    // name default
    return String(a.name || '').localeCompare(String(b.name || ''), 'ro');
  });

  return copy;
});

function openCreate() {
  resetErrors();

  modal.open = true;
  modal.mode = 'create';
  modal.editId = null;
  modal.editLoc = null;

  form.name = '';
  form.city = '';
  form.address = '';

  resetCourtsUi();
}

function openEdit(loc) {
  resetErrors();

  modal.open = true;
  modal.mode = 'edit';
  modal.editId = loc.id;
  modal.editLoc = loc;

  form.name = loc.name || '';
  form.city = loc.city || '';
  form.address = loc.address || '';

  hydrateCourtsDraft(loc);
}

function closeModal() {
  modal.open = false;
  uiError.value = null;
}

function resetErrors() {
  uiError.value = null;
  fieldErrors.name = '';
  fieldErrors.city = '';
  fieldErrors.address = '';
}

function validateLocationForm() {
  fieldErrors.name = '';
  fieldErrors.city = '';
  fieldErrors.address = '';

  let ok = true;

  if (!form.name || form.name.length < 2) {
    fieldErrors.name = 'Name must have at least 2 characters.';
    ok = false;
  }
  if (!form.city || form.city.length < 2) {
    fieldErrors.city = 'City must have at least 2 characters.';
    ok = false;
  }
  if (!form.address || form.address.length < 4) {
    fieldErrors.address = 'Address must have at least 4 characters.';
    ok = false;
  }

  return ok;
}

async function submit() {
  resetErrors();
  if (!validateLocationForm()) return;

  saving.value = true;
  try {
    const payload = {
      name: form.name,
      city: form.city,
      address: form.address,
    };

    if (modal.mode === 'create') {
      await store.create(payload);
      closeModal();
      return;
    }

    // edit mode
    await store.update(modal.editId, payload);

    // refresh local editLoc with latest store item
    // (store.items should update; but we ensure modal uses updated object)
    const updated = store.items.find((x) => x.id === modal.editId);
    if (updated) {
      modal.editLoc = updated;
      hydrateCourtsDraft(updated);
    }

    closeModal();
  } catch (e) {
    uiError.value = store.error || e?.response?.data?.message || 'Operation failed';
  } finally {
    saving.value = false;
  }
}

function confirmDelete(loc) {
  confirm.open = true;
  confirm.id = loc.id;
  confirm.name = loc.name || '—';
  confirm.busy = false;
}

async function doDelete() {
  if (!confirm.id) return;
  confirm.busy = true;
  try {
    await store.remove(confirm.id);
    confirm.open = false;
  } catch (e) {
    // keep confirm open; show store.error
    confirm.busy = false;
    uiError.value = store.error || e?.response?.data?.message || 'Delete failed';
  } finally {
    confirm.busy = false;
  }
}

/**
 * Courts UI helpers
 */
function resetCourtsUi() {
  courtError.value = null;
  courtForm.name = '';
  courtForm.isIndoor = false;
  courtErrors.name = '';
  courtsDraft.value = [];
  courtsOriginalSnapshot.value = new Map();
}

function hydrateCourtsDraft(loc) {
  resetCourtsUi();

  const list = Array.isArray(loc?.courts) ? loc.courts : [];
  courtsDraft.value = list.map((c) => ({
    id: c.id,
    name: c.name || '',
    isIndoor: !!c.isIndoor,
  }));

  const snap = new Map();
  for (const c of courtsDraft.value) {
    snap.set(c.id, JSON.stringify({ name: c.name, isIndoor: c.isIndoor }));
  }
  courtsOriginalSnapshot.value = snap;
}

function isCourtDirty(courtId) {
  const c = courtsDraft.value.find((x) => x.id === courtId);
  if (!c) return false;
  const before = courtsOriginalSnapshot.value.get(courtId);
  const now = JSON.stringify({ name: c.name, isIndoor: !!c.isIndoor });
  return before !== now;
}

function validateCourtForm() {
  courtErrors.name = '';
  if (!courtForm.name || courtForm.name.trim().length < 2) {
    courtErrors.name = 'Court name must have at least 2 characters.';
    return false;
  }
  return true;
}

async function onAddCourt() {
  courtError.value = null;
  if (!modal.editId) return;

  if (!validateCourtForm()) return;

  courtBusy.value = true;
  try {
    const updatedLocation = await addCourt(modal.editId, {
      name: courtForm.name.trim(),
      isIndoor: !!courtForm.isIndoor,
    });

    // update store local item too (so cards update courts count)
    patchStoreLocation(updatedLocation);

    modal.editLoc = updatedLocation;
    hydrateCourtsDraft(updatedLocation);

    courtForm.name = '';
    courtForm.isIndoor = false;
  } catch (e) {
    courtError.value = e?.response?.data?.message || 'Failed to add court.';
  } finally {
    courtBusy.value = false;
  }
}

async function onSaveCourt(c) {
  courtError.value = null;
  if (!modal.editId) return;

  if (!c.name || c.name.trim().length < 2) {
    courtError.value = 'Court name must have at least 2 characters.';
    return;
  }

  courtBusy.value = true;
  try {
    const updatedLocation = await updateCourt(modal.editId, c.id, {
      name: c.name.trim(),
      isIndoor: !!c.isIndoor,
    });

    patchStoreLocation(updatedLocation);

    modal.editLoc = updatedLocation;
    hydrateCourtsDraft(updatedLocation);
  } catch (e) {
    courtError.value = e?.response?.data?.message || 'Failed to update court.';
  } finally {
    courtBusy.value = false;
  }
}

async function onDeleteCourt(c) {
  courtError.value = null;
  if (!modal.editId) return;

  const ok = window.confirm(`Delete court "${c.name || '—'}"?`);
  if (!ok) return;

  courtBusy.value = true;
  try {
    const updatedLocation = await deleteCourt(modal.editId, c.id);

    patchStoreLocation(updatedLocation);

    modal.editLoc = updatedLocation;
    hydrateCourtsDraft(updatedLocation);
  } catch (e) {
    courtError.value = e?.response?.data?.message || 'Failed to delete court.';
  } finally {
    courtBusy.value = false;
  }
}

/**
 * Keep store.items in sync (so cards update immediately)
 */
function patchStoreLocation(updatedLocation) {
  if (!updatedLocation?.id) return;
  const idx = store.items.findIndex((x) => x.id === updatedLocation.id);
  if (idx >= 0) {
    store.items[idx] = updatedLocation;
  }
}

function formatDate(val) {
  const d = typeof val === 'string' ? new Date(val) : val instanceof Date ? val : null;
  if (!d || Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleString();
}

function dateValue(val) {
  const d = typeof val === 'string' ? new Date(val) : val instanceof Date ? val : null;
  return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
}

// If store.items refreshes while modal open, keep editLoc updated
watch(
  () => store.items,
  (items) => {
    if (!modal.open || modal.mode !== 'edit' || !modal.editId) return;
    const latest = items.find((x) => x.id === modal.editId);
    if (latest) {
      modal.editLoc = latest;
      hydrateCourtsDraft(latest);
    }
  },
  { deep: true }
);
</script>