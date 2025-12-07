import axios from 'axios';
import { auth } from '../services/firebase';

export const httpClient = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
});

httpClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);