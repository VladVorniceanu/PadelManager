import { defineStore } from 'pinia';
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../../../api/locationsApi';

export const useAdminLocationsStore = defineStore('adminLocations', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),

  actions: {
    async load() {
      this.loading = true;
      this.error = null;
      try {
        this.items = await fetchLocations();
      } catch (e) {
        console.error(e);
        this.error = e?.response?.data?.message || e?.message || 'Failed to load locations';
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      this.error = null;
      try {
        await createLocation(payload);
        await this.load();
      } catch (e) {
        console.error(e);
        this.error = e?.response?.data?.message || e?.message || 'Failed to create location';
        throw e;
      }
    },

    async update(id, payload) {
      this.error = null;
      try {
        await updateLocation(id, payload);
        await this.load();
      } catch (e) {
        console.error(e);
        this.error = e?.response?.data?.message || e?.message || 'Failed to update location';
        throw e;
      }
    },

    async remove(id) {
      this.error = null;
      try {
        await deleteLocation(id);
        await this.load();
      } catch (e) {
        console.error(e);
        this.error = e?.response?.data?.message || e?.message || 'Failed to delete location';
        throw e;
      }
    },
  },
});