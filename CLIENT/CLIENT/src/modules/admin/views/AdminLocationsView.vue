<template>
  <section class="wrap">
    <header class="header">
      <div>
        <h2 class="title">Locations</h2>
        <p class="subtitle">Adaugă, editează și șterge locații. (Admin only)</p>
      </div>

      <button class="btn primary" @click="openCreate">
        + Add location
      </button>
    </header>

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

    <div v-else-if="!store.items?.length" class="card empty">
      <div class="emptyTitle">Nu există locații încă.</div>
      <div class="emptyMsg">Apasă “Add location” ca să creezi prima locație.</div>
    </div>

    <div v-else class="grid">
      <article v-for="loc in store.items" :key="loc.id" class="locCard">
        <div class="locHead">
          <div>
            <div class="locName">{{ loc.name || '—' }}</div>
            <div class="locMeta">
              <span>{{ loc.city || '—' }}</span>
              <span class="dot">•</span>
              <span>{{ loc.address || '—' }}</span>
            </div>
          </div>

          <div class="actions">
            <button class="btn" @click="openEdit(loc)">Edit</button>
            <button class="btn danger" @click="confirmDelete(loc)">Delete</button>
          </div>
        </div>

        <div class="locBody">
          <div class="stat">
            <div class="statLabel">Courts</div>
            <div class="statValue">{{ (loc.courts?.length ?? 0) }}</div>
          </div>

          <div class="timestamps" v-if="loc.createdAt || loc.updatedAt">
            <div v-if="loc.createdAt">Created: <span>{{ formatDate(loc.createdAt) }}</span></div>
            <div v-if="loc.updatedAt">Updated: <span>{{ formatDate(loc.updatedAt) }}</span></div>
          </div>
        </div>
      </article>
    </div>

    <!-- MODAL -->
    <div v-if="modal.open" class="backdrop" @click.self="closeModal">
      <div class="modal">
        <div class="modalHeader">
          <div class="modalTitle">
            {{ modal.mode === 'create' ? 'Add location' : 'Edit location' }}
          </div>
          <button class="iconBtn" @click="closeModal" aria-label="Close">✕</button>
        </div>

        <form class="form" @submit.prevent="submit">
          <label class="field">
            <div class="label">Name</div>
            <input v-model.trim="form.name" class="input" type="text" placeholder="Ex: Magic Padel" />
          </label>

          <label class="field">
            <div class="label">City</div>
            <input v-model.trim="form.city" class="input" type="text" placeholder="Ex: București" />
          </label>

          <label class="field">
            <div class="label">Address</div>
            <input v-model.trim="form.address" class="input" type="text" placeholder="Ex: Str. Exemplu 10" />
          </label>

          <div class="hint">
            * Courts le adăugăm în pasul următor (Commit 5), ca sub-UI dedicat.
          </div>

          <div class="modalActions">
            <button type="button" class="btn" @click="closeModal">Cancel</button>
            <button type="submit" class="btn primary" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useAdminLocationsStore } from '../store/useAdminLocationsStore';

const store = useAdminLocationsStore();

const saving = ref(false);

const modal = reactive({
  open: false,
  mode: 'create', // 'create' | 'edit'
  editId: null,
});

const form = reactive({
  name: '',
  city: '',
  address: '',
});

onMounted(async () => {
  await store.load();
});

function openCreate() {
  modal.open = true;
  modal.mode = 'create';
  modal.editId = null;
  form.name = '';
  form.city = '';
  form.address = '';
}

function openEdit(loc) {
  modal.open = true;
  modal.mode = 'edit';
  modal.editId = loc.id;
  form.name = loc.name || '';
  form.city = loc.city || '';
  form.address = loc.address || '';
}

function closeModal() {
  modal.open = false;
}

function validate() {
  if (!form.name) return 'Name is required';
  if (!form.city) return 'City is required';
  if (!form.address) return 'Address is required';
  return null;
}

async function submit() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: form.name,
      city: form.city,
      address: form.address,
    };

    if (modal.mode === 'create') {
      await store.create(payload);
    } else {
      await store.update(modal.editId, payload);
    }

    closeModal();
  } catch (_) {
    // store.error e deja setat; păstrăm modalul deschis
    alert(store.error || 'Operation failed');
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(loc) {
  const ok = confirm(`Delete location "${loc.name || '—'}"?`);
  if (!ok) return;

  try {
    await store.remove(loc.id);
  } catch (_) {
    alert(store.error || 'Delete failed');
  }
}

function formatDate(val) {
  // val poate fi string ISO (cum ai în response) sau Date
  const d = typeof val === 'string' ? new Date(val) : val instanceof Date ? val : null;
  if (!d || Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleString();
}
</script>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 16px; }
.header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.title { font-size: 22px; font-weight: 800; margin: 0; }
.subtitle { margin: 6px 0 0; color: #6b7280; }

.card {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  background: #fff;
}
.error { border-color: #fecaca; background: #fff5f5; }
.errorTitle { font-weight: 800; margin-bottom: 6px; }
.errorMsg { color: #7f1d1d; margin-bottom: 12px; }

.empty { text-align: center; padding: 26px; }
.emptyTitle { font-weight: 800; }
.emptyMsg { color: #6b7280; margin-top: 6px; }

.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }

.locCard {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  background: #fff;
}
.locHead { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.locName { font-weight: 900; font-size: 16px; }
.locMeta { color: #6b7280; font-size: 12px; margin-top: 4px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.dot { opacity: .7; }
.actions { display: flex; gap: 8px; }

.locBody { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; gap: 12px; }
.stat { display: flex; flex-direction: column; gap: 2px; }
.statLabel { font-size: 12px; color: #6b7280; }
.statValue { font-size: 18px; font-weight: 900; }

.timestamps { font-size: 12px; color: #6b7280; text-align: right; }
.timestamps span { color: #111827; font-weight: 600; }

.btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 12px;
  padding: 8px 12px;
  cursor: pointer;
}
.btn.primary { background: #111827; color: #fff; border-color: #111827; }
.btn.danger { background: #fff5f5; border-color: #fecaca; }
.btn:disabled { opacity: .6; cursor: not-allowed; }

.skeletonLine {
  height: 14px;
  background: #f3f4f6;
  border-radius: 10px;
  margin: 10px 0;
}

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  display: grid;
  place-items: center;
  z-index: 80;
  padding: 18px;
}
.modal {
  width: min(560px, 100%);
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 12px 30px rgba(0,0,0,.15);
  overflow: hidden;
}
.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 14px 10px;
  border-bottom: 1px solid #f3f4f6;
}
.modalTitle { font-weight: 900; }
.iconBtn { background: transparent; border: none; cursor: pointer; font-size: 18px; padding: 6px; }

.form { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 12px; color: #6b7280; font-weight: 700; }
.input {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
}
.input:focus { border-color: #111827; }

.hint { font-size: 12px; color: #6b7280; margin-top: 4px; }

.modalActions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
</style>