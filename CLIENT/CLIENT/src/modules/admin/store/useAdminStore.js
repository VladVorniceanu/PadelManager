// CLIENT/CLIENT/src/modules/admin/store/useAdminStore.js
import { defineStore } from 'pinia';
import { fetchUsers, promoteUserToAdmin } from '../../../api/usersApi';
import { useAuthStore } from '../../auth/store/useAuthStore';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    loading: false,
    error: null,
  }),

  getters: {
    isCurrentUserAdmin() {
      const authStore = useAuthStore();
      return authStore.user?.role === 'admin';
    },
  },

  actions: {
    async loadUsers() {
      this.loading = true;
      this.error = null;
      try {
        this.users = await fetchUsers();
      } catch (err) {
        console.error('Failed to load users', err);
        this.error = 'Nu am putut încărca utilizatorii.';
      } finally {
        this.loading = false;
      }
    },

    async promote(uid) {
      this.error = null;
      try {
        const updatedUser = await promoteUserToAdmin(uid);
        this.users = this.users.map((u) => (u.uid === updatedUser.uid ? updatedUser : u));

        // dacă am promovat userul curent, actualizăm și authStore
        const authStore = useAuthStore();
        if (authStore.user && authStore.user.uid === updatedUser.uid) {
          authStore.user = { ...authStore.user, role: updatedUser.role };
        }
      } catch (err) {
        console.error('Failed to promote user', err);
        this.error = 'Nu am putut promova utilizatorul.';
      }
    },
  },
});