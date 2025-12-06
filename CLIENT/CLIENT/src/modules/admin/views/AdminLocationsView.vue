<template>
  <div>
    <h1>Locations</h1>

    <button @click="openCreate">+ Add Location</button>

    <div v-if="loading">Loading...</div>

    <div class="locations-list">
      <div
        v-for="loc in locations"
        :key="loc.id"
        class="location-card"
      >
        <h3>{{ loc.name }}</h3>
        <p>{{ loc.city }} — {{ loc.address }}</p>

        <p>
          Courts:
          <strong>{{ loc.courts.length }}</strong>
        </p>

        <button @click="openEdit(loc)">Edit</button>
        <button @click="remove(loc)">Delete</button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="modal">
      <div class="modal-content">
        <AdminLocationForm
          :modelValue="editing"
          @submit="save"
          @cancel="closeForm"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useLocationsStore } from "../../locations/store/useLocationsStore.js";
import AdminLocationForm from "../components/AdminLocationForm.vue";

const store = useLocationsStore();

const showForm = ref(false);
const editing = ref(null);

const loading = computed(() => store.loading);
const locations = computed(() => store.items);

onMounted(() => {
  store.loadLocations();
});

function openCreate() {
  editing.value = null;
  showForm.value = true;
}

function openEdit(loc) {
  editing.value = loc;
  showForm.value = true;
}

async function save(payload) {
  if (editing.value) {
    await store.updateLocation(editing.value.id, payload);
  } else {
    await store.createLocation(payload);
  }
  showForm.value = false;
}

async function remove(loc) {
  if (confirm(`Delete ${loc.name}?`)) {
    await store.deleteLocation(loc.id);
  }
}

function closeForm() {
  showForm.value = false;
}
</script>

<style scoped>
.locations-list {
  margin-top: 20px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.location-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  width: 240px;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 350px;
}
</style>