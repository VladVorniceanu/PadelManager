<!-- CLIENT/CLIENT/src/modules/admin/views/AdminUsersView.vue -->
<template>
  <div class="admin-users">
    <div class="admin-users__header">
      <h4>Users management</h4>
      <p>
        Gestionează conturile din platformă: promovare la rol de admin sau revenire la rol de player.
      </p>
    </div>

    <div v-if="loading" class="card">
      Se încarcă utilizatorii…
    </div>
    <div v-else-if="error" class="card error">
      <div class="errorTitle">Eroare</div>
      <div class="errorMsg">{{ error }}</div>
    </div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Nume</th>
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
            <template v-if="isSelf(user)">
              <span class="pill">Current user</span>
            </template>

            <template v-else>
              <button
                class="btn primary"
                v-if="user.role === 'player'"
                :disabled="updatingId === user.id"
                @click="onChangeRole(user, 'admin')"
              >
                {{ updatingId === user.id ? 'Se promovează…' : 'Promovează la admin' }}
              </button>

              <button
                class="btn"
                v-else
                :disabled="updatingId === user.id"
                @click="onChangeRole(user, 'player')"
              >
                {{ updatingId === user.id ? 'Se actualizează…' : 'Retrogradează la player' }}
              </button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

  <p class="table-note">
    * Datele sunt preluate din colecția <code>users</code> din Firestore, prin backend-ul Express.
  </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchUsers, setUserRole } from '../../../api/usersApi';
import { auth } from '../../../services/firebase';


const users = ref([]);
const loading = ref(false);
const error = ref(null);
const updatingId = ref(null);

function isSelf(user) {
  return auth.currentUser?.uid && user?.id === auth.currentUser.uid;
}

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