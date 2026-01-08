import { defineStore } from 'pinia';
import {
  fetchLocations,
  fetchLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../../../api/locationsApi.js';

const sid = (v) => (v == null ? '' : String(v));

export const useLocationsStore = defineStore('locations', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),

  getters: {
    byId: (s) => {
      const map = new Map();
      for (const l of s.items || []) {
        const key = sid(l?.id);
        if (key) map.set(key, l);
      }
      return map;
    },
  },

  actions: {
    async loadLocations() {
      this.loading = true;
      this.error = null;
      try {
        this.items = await fetchLocations();
      } catch (e) {
        this.error = e?.message || 'Failed to load locations.';
      } finally {
        this.loading = false;
      }
    },

    async loadLocationsOnce() {
      if ((this.items?.length || 0) > 0) return;
      await this.loadLocations();
    },

    async createLocation(payload) {
      this.loading = true;
      try {
        const created = await createLocation(payload);
        this.items.push(created);
        return created;
      } finally {
        this.loading = false;
      }
    },

    async updateLocation(id, payload) {
      this.loading = true;
      try {
        const updated = await updateLocation(id, payload);
        const targetId = sid(id);
        this.items = (this.items || []).map((loc) =>
          sid(loc?.id) === targetId ? updated : loc
        );
        return updated;
      } finally {
        this.loading = false;
      }
    },

    async deleteLocation(id) {
      this.loading = true;
      try {
        await deleteLocation(id);
        const targetId = sid(id);
        this.items = (this.items || []).filter((l) => sid(l?.id) !== targetId);
      } finally {
        this.loading = false;
      }
    },

    async fetchLocationById(id) {
      this.loading = true;
      this.error = null;
      try {
        const loc = await fetchLocation(id);
        const targetId = sid(id);

        const index = (this.items || []).findIndex((l) => sid(l?.id) === targetId);
        if (index >= 0) this.items[index] = loc;
        else this.items.push(loc);

        return loc;
      } catch (e) {
        this.error = e?.message || 'Failed to fetch location.';
        return null;
      } finally {
        this.loading = false;
      }
    },
  },
});