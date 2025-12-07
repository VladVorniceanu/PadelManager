<!-- CLIENT/CLIENT/src/modules/admin/views/AdminUsersView.vue -->
<template>
  <div class="admin-users">
    <div class="admin-users__header">
      <h4>Users management</h4>
      <p>
        Gestionează conturile din platformă: promovare la rol de admin sau revenire la rol de player.
      </p>
    </div>

    <div v-if="loading" class="admin-users__state">Se încarcă utilizatorii…</div>
    <div v-else-if="error" class="admin-users__state error">{{ error }}</div>

    <table v-else class="admin-users__table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Nume afișat</th>
          <th>Rol</th>
          <th>Status</th>
          <th style="width: 220px;">Acțiuni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.email }}</td>
          <td>{{ user.displayName || '—' }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.status || 'activ' }}</td>
          <td>
            <button
              v-if="user.role === 'player'"
              type="button"
              class="tag-btn promote"
              @click="onChangeRole(user, 'admin')"
              :disabled="updatingId === user.id"
            >
              {{ updatingId === user.id ? 'Se promovează…' : 'Promovează la admin' }}
            </button>

            <button
              v-else
              type="button"
              class="tag-btn demote"
              @click="onChangeRole(user, 'player')"
              :disabled="updatingId === user.id"
            >
              {{ updatingId === user.id ? 'Se actualizează…' : 'Retrogradează la player' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p class="admin-users__note">
      * Datele sunt preluate din colecția <code>users</code> din Firestore, prin backend-ul Express.
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchUsers, setUserRole } from '../../../api/usersApi';

const users = ref([]);
const loading = ref(false);
const error = ref(null);
const updatingId = ref(null);

async function loadUsers() {
  loading.value = true;
  error.value = null;

  try {
    users.value = await fetchUsers();
  } catch (err) {
    console.error(err);
    error.value = 'Nu am putut încărca utilizatorii. Încearcă din nou.';
  } finally {
    loading.value = false;
  }
}

async function onChangeRole(user, newRole) {
  if (user.role === newRole) return;

  updatingId.value = user.id;
  try {
    const updated = await setUserRole(user.id, newRole);
    users.value = users.value.map((u) => (u.id === user.id ? updated : u));
  } catch (err) {
    console.error(err);
    alert('A apărut o eroare la actualizarea rolului.');
  } finally {
    updatingId.value = null;
  }
}

onMounted(loadUsers);
</script>

<style scoped>
.admin-users__header h4 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.admin-users__header p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.admin-users__state {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.admin-users__state.error {
  color: #b91c1c;
}

.admin-users__table {
  width: 100%;
  margin-top: 1rem;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.admin-users__table th,
.admin-users__table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 0.55rem 0.5rem;
  text-align: left;
}

.admin-users__table thead {
  background: #f9fafb;
}

.tag-btn {
  border-radius: 999px;
  border: none;
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.05s ease;
}

.tag-btn:disabled {
  opacity: 0.6;
  cursor: default;
  transform: none;
}

.tag-btn.promote {
  background: #111827;
  color: #ffffff;
}

.tag-btn.promote:hover:not(:disabled) {
  background: #030712;
  transform: translateY(-1px);
}

.tag-btn.demote {
  background: #e5e7eb;
  color: #111827;
}

.tag-btn.demote:hover:not(:disabled) {
  background: #d1d5db;
  transform: translateY(-1px);
}

.admin-users__note {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: #9ca3af;
}
</style>