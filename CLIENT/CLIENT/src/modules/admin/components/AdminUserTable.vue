<template>
  <div class="admin-users-table">
    <table>
      <thead>
        <tr>
          <th>Email</th>
          <th>Nume</th>
          <th>Rol</th>
          <th>Acțiuni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.uid || user.id">
          <td>{{ user.email }}</td>
          <td>{{ user.displayName || '—' }}</td>
          <td>
            <span :class="['role-badge', user.role]">
              {{ user.role }}
            </span>
          </td>
          <td>
            <button
              v-if="user.role !== 'admin'"
              @click="$emit('promote', user)"
            >
              Promovează la admin
            </button>
            <span v-else>—</span>
          </td>
        </tr>
        <tr v-if="!users || users.length === 0">
          <td colspan="4">Nu există utilizatori înregistrați.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  users: {
    type: Array,
    required: true,
  },
});
defineEmits(['promote']);
</script>

<style scoped>
.admin-users-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid #ddd;
}

tbody td {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.role-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.role-badge.player {
  background: #e0f2fe;
}

.role-badge.admin {
  background: #dcfce7;
}
</style>