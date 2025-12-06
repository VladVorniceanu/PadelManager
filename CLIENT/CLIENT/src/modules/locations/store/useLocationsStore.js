import { defineStore } from 'pinia';
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../../../api/locationsApi.js';

export const useLocationsStore = defineStore('locations', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),

  actions: {
    async loadLocations() {
      this.loading = true;
      this.error = null;
      try {
        this.items = await fetchLocations();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
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
        this.items = this.items.map((loc) =>
          loc.id === id ? updated : loc
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
        this.items = this.items.filter((l) => l.id !== id);
      } finally {
        this.loading = false;
      }
    },
  },
});