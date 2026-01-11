<!-- CLIENT/CLIENT/src/modules/admin/views/AdminUsersView.vue -->
<template>
  <div class="admin-users">
    <div class="admin-users__header">
      <h4>Users management</h4>
      <p>
        Manage user roles within the application. Promote players to admins or
        demote admins back to players.
      </p>
    </div>

    <UiStateCard v-if="loading" variant="loading" :lines="2" />

    <UiStateCard v-else-if="error" variant="error" title="Error" :message="error" />

    <table v-else class="table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Name</th>
          <th>Role</th>
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
              <UiButton disabled>Current user</UiButton>
            </template>

            <template v-else>
              <UiButton variant="primary"
                
                v-if="user.role === 'player'"
                :disabled="updatingId === user.id"
                @click="onChangeRole(user, 'admin')"
              >
                {{ updatingId === user.id ? 'Promoting…' : 'Promote to admin' }}
              </UiButton>

              <UiButton variant="danger"
                
                v-else
                :disabled="updatingId === user.id"
                @click="onChangeRole(user, 'player')"
              >
                {{ updatingId === user.id ? 'Updating…' : 'Demote to player' }}
              </UiButton>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

  <p class="table-note">
    * Data is fetched from the <code>users</code> collection in Firestore via the Express backend.
  </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';

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
    error.value = 'Failed to load users.';
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
    alert('An error occurred while updating the role.');
  } finally {
    updatingId.value = null;
  }
}

onMounted(loadUsers);
</script>