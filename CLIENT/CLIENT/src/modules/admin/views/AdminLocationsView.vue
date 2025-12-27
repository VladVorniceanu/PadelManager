<template>
  <section class="wrap">
    <!-- Header -->
    <header class="header">
      <div class="headLeft">
        <h2 class="title">Locations</h2>
        <p class="subtitle">Admin: gestionează locații și terenuri (courts).</p>
      </div>

      <div class="headRight">
        <div class="searchWrap">
          <span class="searchIcon">⌕</span>
          <input
            v-model.trim="q"
            class="search"
            type="text"
            placeholder="Caută după nume / oraș / adresă…"
          />
          <button v-if="q" class="clearBtn" @click="q = ''" aria-label="Clear search">
            ✕
          </button>
        </div>

        <select v-model="sortBy" class="select" aria-label="Sort">
          <option value="name">Sort: Name</option>
          <option value="city">Sort: City</option>
          <option value="courts">Sort: Courts</option>
          <option value="updatedAt">Sort: Updated</option>
        </select>

        <button class="btn primary" @click="openCreate">
          + Add location
        </button>
      </div>
    </header>

    <!-- States -->
    <div v-if="store.loading" class="card">
      <div class="skeletonLine"></div>
      <div class="skeletonLine"></div>
      <div class="skeletonLine"></div>
    </div>

    <div v-else-if="store.error" class="card error">
      <div class="errorTitle">Eroare</div>
      <div class="errorMsg">{{ store.error }}</div>
      <button class="btn" @click="store.load">Retry</button>
    </div>

    <div v-else-if="!filteredAndSorted.length" class="card empty">
      <div class="emptyTitle">Nu există locații (sau filtrul nu găsește nimic).</div>
      <div class="emptyMsg">
        Încearcă să ștergi căutarea sau apasă “Add location”.
      </div>
      <div class="emptyActions">
        <button class="btn" @click="q = ''">Clear search</button>
        <button class="btn primary" @click="openCreate">+ Add location</button>
      </div>
    </div>

    <!-- Grid -->
    <div v-else class="grid">
      <article v-for="loc in filteredAndSorted" :key="loc.id" class="locCard">
        <div class="locHead">
          <div class="locIdentity">
            <div class="locNameRow">
              <div class="locName">{{ loc.name || '—' }}</div>
              <span class="pill">
                {{ (loc.courts?.length ?? 0) }} courts
              </span>
            </div>

            <div class="locMeta">
              <span class="metaItem">📍 {{ loc.city || '—' }}</span>
              <span class="dot">•</span>
              <span class="metaItem">{{ loc.address || '—' }}</span>
            </div>
          </div>

          <div class="actions">
            <button class="btn" @click="openEdit(loc)">Edit</button>
            <button class="btn danger" @click="confirmDelete(loc)">Delete</button>
          </div>
        </div>

        <div class="locBody">
          <div class="timestamps" v-if="loc.createdAt || loc.updatedAt">
            <div v-if="loc.createdAt">
              Created: <span>{{ formatDate(loc.createdAt) }}</span>
            </div>
            <div v-if="loc.updatedAt">
              Updated: <span>{{ formatDate(loc.updatedAt) }}</span>
            </div>
          </div>

          <div class="quickActions">
            <button class="btn subtle" @click="openEdit(loc)">
              Manage courts →
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- MODAL -->
    <div v-if="modal.open" class="backdrop" @click.self="closeModal">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modalHeader">
          <div>
            <div class="modalTitle">
              {{ modal.mode === 'create' ? 'Add location' : 'Edit location' }}
            </div>
            <div class="modalSubtitle">
              {{ modal.mode === 'create'
                ? 'Completează detaliile locației.'
                : 'Editează detaliile și gestionează terenurile.'
              }}
            </div>
          </div>
          <button class="iconBtn" @click="closeModal" aria-label="Close">✕</button>
        </div>

        <!-- Errors -->
        <div v-if="uiError" class="inlineError">
          <div class="inlineErrorTitle">Nu putem salva</div>
          <div class="inlineErrorMsg">{{ uiError }}</div>
        </div>

        <form class="form" @submit.prevent="submit">
          <!-- Location fields -->
          <div class="sectionTitle">Location details</div>

          <div class="formGrid">
            <label class="field">
              <div class="label">Name</div>
              <input
                v-model.trim="form.name"
                class="input"
                type="text"
                placeholder="Ex: Magic Padel"
                :class="{ invalid: !!fieldErrors.name }"
              />
              <div v-if="fieldErrors.name" class="fieldError">{{ fieldErrors.name }}</div>
            </label>

            <label class="field">
              <div class="label">City</div>
              <input
                v-model.trim="form.city"
                class="input"
                type="text"
                placeholder="Ex: București"
                :class="{ invalid: !!fieldErrors.city }"
              />
              <div v-if="fieldErrors.city" class="fieldError">{{ fieldErrors.city }}</div>
            </label>

            <label class="field full">
              <div class="label">Address</div>
              <input
                v-model.trim="form.address"
                class="input"
                type="text"
                placeholder="Ex: Str. Exemplu 10"
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
                  Adaugă / editează terenuri pentru această locație.
                </div>
              </div>
              <span class="pill strong">{{ courts.length }} total</span>
            </div>

            <!-- Add court -->
            <div class="courtAddRow">
              <label class="field grow">
                <div class="label">Court name</div>
                <input
                  v-model.trim="courtForm.name"
                  class="input"
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

              <button
                type="button"
                class="btn primary"
                :disabled="courtBusy"
                @click="onAddCourt"
              >
                {{ courtBusy ? 'Adding…' : '+ Add' }}
              </button>
            </div>

            <div v-if="courtError" class="inlineNotice">
              {{ courtError }}
            </div>

            <!-- Courts list -->
            <div v-if="courts.length === 0" class="courtsEmpty">
              Niciun teren adăugat încă.
            </div>

            <div v-else class="courtsList">
              <div class="courtRow" v-for="c in courtsDraft" :key="c.id">
                <div class="courtLeft">
                  <input v-model.trim="c.name" class="input small" placeholder="Court name" />
                  <label class="toggle smallToggle">
                    <input type="checkbox" v-model="c.isIndoor" />
                    <span>Indoor</span>
                  </label>
                </div>

                <div class="courtRight">
                  <button
                    type="button"
                    class="btn"
                    :disabled="courtBusy || !isCourtDirty(c.id)"
                    @click="onSaveCourt(c)"
                    title="Save changes"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    class="btn danger"
                    :disabled="courtBusy"
                    @click="onDeleteCourt(c)"
                    title="Delete court"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="modalActions">
            <button type="button" class="btn" @click="closeModal">Cancel</button>
            <button type="submit" class="btn primary" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save location' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete confirm mini-modal -->
    <div v-if="confirm.open" class="backdrop" @click.self="confirm.open = false">
      <div class="confirm">
        <div class="confirmTitle">Confirm delete</div>
        <div class="confirmMsg">
          Ștergi locația <b>{{ confirm.name }}</b>? Acțiunea este ireversibilă.
        </div>

        <div class="confirmActions">
          <button class="btn" @click="confirm.open = false">Cancel</button>
          <button class="btn danger" :disabled="confirm.busy" @click="doDelete">
            {{ confirm.busy ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
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

<style scoped>
/* Layout */
.wrap { display: flex; flex-direction: column; gap: 16px; }
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.headLeft { display: flex; flex-direction: column; gap: 6px; }
.headRight { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.title { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.02em; }
.subtitle { margin: 0; color: #6b7280; font-size: 13px; }

/* Search */
.searchWrap {
  position: relative;
  display: flex;
  align-items: center;
}
.searchIcon {
  position: absolute;
  left: 10px;
  color: #6b7280;
  font-size: 14px;
}
.search {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 10px 34px 10px 30px;
  outline: none;
  min-width: 260px;
}
.search:focus { border-color: #111827; }
.clearBtn {
  position: absolute;
  right: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 6px;
  color: #6b7280;
}

/* Select */
.select {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 10px 12px;
  outline: none;
  background: #fff;
}

/* Cards */
.card {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 14px;
  background: #fff;
}
.error { border-color: #fecaca; background: #fff5f5; }
.errorTitle { font-weight: 900; margin-bottom: 6px; }
.errorMsg { color: #7f1d1d; margin-bottom: 12px; }

.empty { text-align: center; padding: 26px; }
.emptyTitle { font-weight: 900; }
.emptyMsg { color: #6b7280; margin-top: 6px; }
.emptyActions { display: flex; justify-content: center; gap: 10px; margin-top: 14px; flex-wrap: wrap; }

/* Grid + location card */
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }

.locCard {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 14px;
  background: #fff;
  transition: transform .12s ease, box-shadow .12s ease;
}
.locCard:hover { transform: translateY(-1px); box-shadow: 0 10px 20px rgba(0,0,0,.06); }

.locHead { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.locIdentity { display: flex; flex-direction: column; gap: 6px; }
.locNameRow { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.locName { font-weight: 950; font-size: 16px; letter-spacing: -0.01em; }

.locMeta { color: #6b7280; font-size: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.metaItem { display: inline-flex; gap: 6px; align-items: center; }
.dot { opacity: .6; }

.actions { display: flex; gap: 8px; }

.locBody { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; gap: 12px; }
.timestamps { font-size: 12px; color: #6b7280; }
.timestamps span { color: #111827; font-weight: 700; }
.quickActions { display: flex; justify-content: flex-end; }
.btn.subtle { background: #f9fafb; }

/* Buttons */
.btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 14px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 700;
}
.btn.primary { background: #111827; color: #fff; border-color: #111827; }
.btn.danger { background: #fff5f5; border-color: #fecaca; }
.btn:disabled { opacity: .6; cursor: not-allowed; }

/* Skeleton */
.skeletonLine {
  height: 14px;
  background: #f3f4f6;
  border-radius: 10px;
  margin: 10px 0;
}

/* Modal */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17,24,39,.45);
  display: grid;
  place-items: center;
  z-index: 120;
  padding: 18px;
}

.modal {
  width: min(760px, 100%);
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 45px rgba(0,0,0,.2);
  overflow: hidden;
}

.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f3f4f6;
  gap: 12px;
}
.modalTitle { font-weight: 950; font-size: 16px; }
.modalSubtitle { color: #6b7280; font-size: 12px; margin-top: 4px; }
.iconBtn { background: transparent; border: none; cursor: pointer; font-size: 18px; padding: 6px; color: #111827; }

.inlineError {
  margin: 14px 16px 0;
  border: 1px solid #fecaca;
  background: #fff5f5;
  border-radius: 16px;
  padding: 12px;
}
.inlineErrorTitle { font-weight: 900; color: #7f1d1d; margin-bottom: 4px; }
.inlineErrorMsg { color: #7f1d1d; font-size: 13px; }

.inlineNotice {
  margin-top: 10px;
  border: 1px solid #fde68a;
  background: #fffbeb;
  border-radius: 14px;
  padding: 10px 12px;
  color: #92400e;
  font-size: 13px;
}

.form { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

.sectionTitle { font-weight: 950; font-size: 13px; color: #111827; }
.sectionHint { font-size: 12px; color: #6b7280; margin-top: 4px; }

.formGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 720px) {
  .formGrid { grid-template-columns: 1fr; }
}
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.label { font-size: 12px; color: #6b7280; font-weight: 800; }

.input {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 10px 12px;
  outline: none;
}
.input.small { padding: 8px 10px; border-radius: 12px; }
.input:focus { border-color: #111827; }
.input.invalid { border-color: #ef4444; }

.fieldError { font-size: 12px; color: #b00020; }

.divider {
  height: 1px;
  background: #f3f4f6;
  margin: 4px 0;
}

/* Courts */
.courtsWrap { display: flex; flex-direction: column; gap: 12px; }
.courtsHeader { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }

.courtAddRow {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.grow { flex: 1 1 260px; }

.courtsEmpty {
  padding: 12px;
  border: 1px dashed #e5e7eb;
  border-radius: 16px;
  color: #6b7280;
  font-size: 13px;
}

.courtsList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.courtRow {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 16px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.courtLeft { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.courtRight { display: flex; gap: 8px; }

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #111827;
  user-select: none;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 10px 12px;
  border-radius: 14px;
}
.smallToggle { padding: 8px 10px; border-radius: 12px; }
.toggle input { transform: translateY(1px); }

.pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 12px;
  font-weight: 900;
  color: #111827;
}
.pill.strong { background: #111827; color: #fff; border-color: #111827; }

/* Modal actions */
.modalActions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 6px;
}

/* Confirm modal */
.confirm {
  width: min(520px, 100%);
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 45px rgba(0,0,0,.2);
  padding: 16px;
}
.confirmTitle { font-weight: 950; font-size: 16px; }
.confirmMsg { color: #374151; margin-top: 8px; font-size: 13px; line-height: 1.5; }
.confirmActions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }
</style>