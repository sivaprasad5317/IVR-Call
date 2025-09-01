// src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});
export const getACSToken = async () => {
  const response = await api.get('/api/acs/token');
  return response.data;
};
export const makeCall = async (phoneNumber) => {
  const response = await api.post('/api/calls', { phoneNumber });
  return response.data;
};