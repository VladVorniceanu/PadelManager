import { defineStore } from 'pinia';
import { fetchUsers, searchUsers } from '@/api/usersApi';

export const useUsersStore = defineStore('users', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
    loadedOnce: false,
  }),

  getters: {
    byId: (s) => {
      const map = new Map();
      for (const u of s.items || []) map.set(u.id, u);
      return map;
    },
  },

  actions: {
    async loadUsersOnce() {
      if (this.loadedOnce && (this.items?.length || 0) > 0) return;
      this.loading = true;
      this.error = null;
      try {
        this.items = await fetchUsers();
        this.loadedOnce = true;
      } catch (e) {
        this.error = e?.message || 'Failed to load users';
      } finally {
        this.loading = false;
      }
    },

    async search(q, limit = 10) {
      return await searchUsers(q, limit);
    },

    upsertMany(list) {
      const incoming = Array.isArray(list) ? list : [];
      const map = new Map((this.items || []).map((u) => [u.id, u]));
      for (const u of incoming) {
        if (!u?.id) continue;
        map.set(u.id, { ...(map.get(u.id) || {}), ...u });
      }
      this.items = Array.from(map.values());
    },
  },
});