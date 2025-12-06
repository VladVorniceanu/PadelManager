import axios from 'axios';

export const httpClient = axios.create({
  baseURL: 'http://localhost:4000/api', 
  timeout: 10000,
});

httpClient.interceptors.request.use(
  (config) => {
    
    return config;
  },
  (error) => Promise.reject(error)
);