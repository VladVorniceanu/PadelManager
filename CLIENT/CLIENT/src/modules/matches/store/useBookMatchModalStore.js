import { defineStore } from 'pinia';

export const useBookMatchModalStore = defineStore('bookMatchModal', {
  state: () => ({
    open: false,
    // optional prefill
    locationId: null,
  }),
  actions: {
    openModal(opts = {}) {
      this.open = true;
      this.locationId = opts.locationId ?? null;
    },
    closeModal() {
      this.open = false;
      this.locationId = null;
    },
  },
});