<template>
  <div class="form">
    <h2>{{ isEdit ? "Edit Location" : "Create Location" }}</h2>

    <label>Name</label>
    <input v-model="form.name" type="text" />

    <label>Address</label>
    <input v-model="form.address" type="text" />

    <label>City</label>
    <input v-model="form.city" type="text" />

    <!-- Courts section -->
    <div class="courts">
      <h3>Courts</h3>

      <button @click="addCourt">Add court</button>

      <div
        v-for="(court, index) in form.courts"
        :key="court.id"
        class="court-item"
      >
        <input v-model="court.name" placeholder="Court name" />
        <label>
          <input type="checkbox" v-model="court.indoor" />
          Indoor
        </label>

        <button @click="removeCourt(index)">X</button>
      </div>
    </div>

    <div class="actions">
      <button @click="cancel">Cancel</button>
      <button @click="submit">{{ isEdit ? "Save" : "Create" }}</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';

const props = defineProps({
  modelValue: Object,
});

const emit = defineEmits(["cancel", "submit"]);

const form = reactive(
  props.modelValue
    ? { ...props.modelValue, courts: [...props.modelValue.courts] }
    : {
        name: "",
        address: "",
        city: "",
        courts: [],
      }
);

const isEdit = computed(() => !!props.modelValue);

function addCourt() {
  form.courts.push({
    id: "court-" + Date.now(),
    name: "Court " + (form.courts.length + 1),
    indoor: false,
  });
}

function removeCourt(index) {
  form.courts.splice(index, 1);
}

function cancel() {
  emit("cancel");
}

function submit() {
  emit("submit", { ...form });
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.courts {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 6px;
}
.court-item {
  display: flex;
  gap: 10px;
  margin: 5px 0;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>