import axios from 'axios';
import type { LoginCredentials, RegisterData, User, Land, Payment } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Land API
export const landAPI = {
  getAll: async (): Promise<Land[]> => {
    const response = await api.get('/lands');
    return response.data;
  },

  getById: async (id: string): Promise<Land> => {
    const response = await api.get(`/lands/${id}`);
    return response.data;
  },

  create: async (landData: FormData): Promise<Land> => {
    const response = await api.post('/lands', landData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, landData: Partial<Land>): Promise<Land> => {
    const response = await api.put(`/lands/${id}`, landData);
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  create: async (paymentData: FormData): Promise<Payment> => {
    const response = await api.post('/payments', paymentData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getByBuyer: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/my-payments');
    return response.data;
  },

  verify: async (paymentId: string, verified: boolean, remarks?: string): Promise<Payment> => {
    const response = await api.post(`/payments/${paymentId}/verify`, { verified, remarks });
    return response.data;
  },

  getPending: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/pending');
    return response.data;
  },
};

export default api;

