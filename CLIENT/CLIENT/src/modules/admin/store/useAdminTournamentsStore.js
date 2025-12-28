import { defineStore } from 'pinia';
import {
    fetchTournaments,
    createTournament,
    updateTournament,
    deleteTournament
} from '../../../api/tournamentsApi';

export const useAdminTournamentsStore = defineStore('adminTournaments', {
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
                this.items = await fetchTournaments();
            } catch (err) {
                console.error('Error loading tournaments:', err);
                this.error = err?.response?.data?.message || err?.message || 'Failed to load tournaments';
            } finally {
                this.loading = false;
            }
        },

        async create(payload) {
            this.error = null;
            try {
                await createTournament(payload);
                await this.load();
            } catch (err) {
                console.error('Error creating tournament:', err);
                this.error = err?.response?.data?.message || err?.message || 'Failed to create tournament';
                throw err;
            }
        },

        async update(id, payload) {
            this.error = null;
            try {
                await updateTournament(id, payload);
                await this.load();
            } catch (err) {
                console.error('Error updating tournament:', err);
                this.error = err?.response?.data?.message || err?.message || 'Failed to update tournament';
                throw err;
            }
        },

        async delete(id) {
            this.error = null;
            try {
                await deleteTournament(id);
                await this.load();
            } catch (err) {
                console.error('Error deleting tournament:', err);
                this.error = err?.response?.data?.message || err?.message || 'Failed to delete tournament';
                throw err;
            }
        },
    },
});