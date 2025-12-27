import { defineStore } from 'pinia';

import {
  fetchLocations as apiFetchLocations,
  createLocation as apiCreateLocation,
  updateLocation as apiUpdateLocation,
  deleteLocation as apiDeleteLocation,
  addCourt as apiAddCourt,
  updateCourt as apiUpdateCourt,
  deleteCourt as apiDeleteCourt,
} from '../../../api/locationsApi';

function extractErrorMessage(e, fallback) {
  return (
    e?.response?.data?.message ||
    (Array.isArray(e?.response?.data?.errors) ? e.response.data.errors.join(', ') : null) ||
    e?.message ||
    fallback
  );
}

export const useAdminLocationsStore = defineStore('adminLocations', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),

  getters: {
    byId: (state) => (id) => state.items.find((x) => x.id === id),
  },

  actions: {
    _setError(e, fallback) {
      this.error = extractErrorMessage(e, fallback);
    },

    _patchLocation(updatedLocation) {
      if (!updatedLocation?.id) return;
      const idx = this.items.findIndex((x) => x.id === updatedLocation.id);
      if (idx >= 0) {
        // înlocuiește obiectul ca să trigger-uiască reactivitatea
        this.items.splice(idx, 1, updatedLocation);
      } else {
        // dacă nu există, îl adăugăm
        this.items.unshift(updatedLocation);
      }
    },

    async load() {
      this.loading = true;
      this.error = null;
      try {
        const data = await apiFetchLocations();
        this.items = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error(e);
        this._setError(e, 'Failed to load locations');
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      this.error = null;
      try {
        // presupunem că API-ul returnează location (sau {data: location})
        const res = await apiCreateLocation(payload);
        const loc = res?.data ?? res;
        if (loc?.id) this._patchLocation(loc);
        else await this.load();
        return loc;
      } catch (e) {
        console.error(e);
        this._setError(e, 'Failed to create location');
        throw e;
      }
    },

    async update(id, payload) {
      this.error = null;
      try {
        const res = await apiUpdateLocation(id, payload);
        const loc = res?.data ?? res;
        if (loc?.id) this._patchLocation(loc);
        else await this.load();
        return loc;
      } catch (e) {
        console.error(e);
        this._setError(e, 'Failed to update location');
        throw e;
      }
    },

    async remove(id) {
      this.error = null;
      try {
        await apiDeleteLocation(id);
        const idx = this.items.findIndex((x) => x.id === id);
        if (idx >= 0) this.items.splice(idx, 1);
        return true;
      } catch (e) {
        console.error(e);
        this._setError(e, 'Failed to delete location');
        throw e;
      }
    },

    async addCourt(locationId, payload) {
      this.error = null;
      try {
        const res = await apiAddCourt(locationId, payload);
        const loc = res?.data ?? res;
        if (loc?.id) this._patchLocation(loc);
        else await this.load();
        return loc;
      } catch (e) {
        console.error(e);
        this._setError(e, 'Failed to add court');
        throw e;
      }
    },

    async updateCourt(locationId, courtId, payload) {
      this.error = null;
      try {
        const res = await apiUpdateCourt(locationId, courtId, payload);
        const loc = res?.data ?? res;
        if (loc?.id) this._patchLocation(loc);
        else await this.load();
        return loc;
      } catch (e) {
        console.error(e);
        this._setError(e, 'Failed to update court');
        throw e;
      }
    },

    async deleteCourt(locationId, courtId) {
      this.error = null;
      try {
        const res = await apiDeleteCourt(locationId, courtId);
        const loc = res?.data ?? res;
        if (loc?.id) this._patchLocation(loc);
        else await this.load();
        return loc;
      } catch (e) {
        console.error(e);
        this._setError(e, 'Failed to delete court');
        throw e;
      }
    },
  },
});