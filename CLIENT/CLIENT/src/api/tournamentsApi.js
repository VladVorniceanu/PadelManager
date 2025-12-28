import { httpClient } from "./httpClient";

export async function fetchTournaments() {
    const res = await httpClient.get('/tournaments');
    return res.data?.data ?? [];
}

export async function createTournament(payload) {
    const res = await httpClient.post('/tournaments', payload);
    return res.data?.data;
}

export async function updateTournament(id, payload) {
    const res = await httpClient.put(`/tournaments/${id}`, payload);
    return res.data?.data;
}

export async function deleteTournament(id) {
    await httpClient.delete(`/tournaments/${id}`);
}