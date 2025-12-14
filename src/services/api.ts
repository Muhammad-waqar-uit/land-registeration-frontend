import axios from 'axios';
import type { LoginCredentials, RegisterData, User, Land, Payment } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Log API URL on startup for debugging

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Disable if CORS is blocking
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

// Add error interceptor for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Network Error - Backend not reachable:', API_BASE_URL);
      console.error('Make sure backend is running and CORS is enabled');
    } else if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/login', credentials);
    // Handle backend response structure: { data: { user, token }, success: true }
    const responseData = response.data.data || response.data;
    if (responseData.token) {
      localStorage.setItem('token', responseData.token);
    }
    return responseData;
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/register', data);
    // Handle backend response structure: { data: { user, token }, success: true }
    const responseData = response.data.data || response.data;
    if (responseData.token) {
      localStorage.setItem('token', responseData.token);
    }
    return responseData;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    // Handle backend response structure: { data: { user }, success: true }
    return response.data.data || response.data;
  },

  updateProfile: async (data: { name: string; email: string }): Promise<User> => {
    const response = await api.patch('/auth/profile', data);
    // Handle backend response structure: { data: { user }, success: true }
    return response.data.data || response.data;
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    const response = await api.patch('/auth/password', data);
    // Handle backend response structure: { data: {...}, success: true }
    return response.data.data || response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    // Handle backend response structure: { data: {...}, success: true } or direct response
    return response.data.data || response.data;
  },

  resetPassword: async (data: { token: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', data);
    // Handle backend response structure: { data: {...}, success: true } or direct response
    return response.data.data || response.data;
  },
};

// Land API
export interface LandQueryParams {
  status?: 'available' | 'locked' | 'sold';
  ownerId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface LandListResponse {
  data: Land[];
  total: number;
  page: number;
  limit: number;
}

export const landAPI = {
  getAll: async (params?: LandQueryParams): Promise<Land[] | LandListResponse> => {
    const response = await api.get('/lands', { params });
    // Handle backend response structure: { data: [...], success: true } or { data: [...], total, page, limit }
    const responseData = response.data.data || response.data;
    // If pagination data exists, return full response
    if (response.data.total !== undefined) {
      return {
        data: responseData,
        total: response.data.total,
        page: response.data.page || 1,
        limit: response.data.limit || 10,
      };
    }
    return responseData;
  },

  getById: async (id: string): Promise<Land> => {
    const response = await api.get(`/lands/${id}`);
    // Handle backend response structure: { data: {...}, success: true }
    return response.data.data || response.data;
  },

  create: async (landData: FormData): Promise<Land> => {
    const response = await api.post('/lands', landData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Handle backend response structure: { data: {...}, success: true }
    return response.data.data || response.data;
  },

  update: async (id: string, landData: FormData): Promise<Land> => {
    const response = await api.patch(`/lands/${id}`, landData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Handle backend response structure: { data: {...}, success: true }
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/lands/${id}`);
    // Handle backend response structure: { data: {...}, success: true } or direct response
    return response.data.data || response.data;
  },

  verify: async (id: string): Promise<{
    verified: boolean;
    message: string;
    document?: {
      verified: boolean;
      message: string;
      storedHash: string;
      calculatedHash: string;
    };
    image?: {
      verified: boolean;
      message: string;
      storedHash: string;
      calculatedHash: string;
    };
  }> => {
    const response = await api.post(`/lands/${id}/verify`);
    // Handle backend response structure: { data: {...}, success: true } or direct response
    return response.data.data || response.data;
  },
};

// Payment API
export const paymentAPI = {
  create: async (paymentData: FormData): Promise<Payment> => {
    const response = await api.post('/payments', paymentData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Handle backend response structure: { data: {...}, success: true }
    return response.data.data || response.data;
  },

  getByBuyer: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/my-payments');
    // Handle backend response structure: { data: [...], success: true }
    return response.data.data || response.data;
  },

  verify: async (paymentId: string, verified: boolean, remarks?: string): Promise<Payment> => {
    const response = await api.post(`/payments/${paymentId}/verify`, { verified, remarks });
    // Handle backend response structure: { data: {...}, success: true }
    return response.data.data || response.data;
  },

  getPending: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/pending');
    // Handle backend response structure: { data: [...], success: true }
    return response.data.data || response.data;
  },
};

// Contact API
export const contactAPI = {
  sendMessage: async (data: { name: string; email: string; message: string }): Promise<{ message: string }> => {
    const response = await api.post('/contact', data);
    // Handle backend response structure: { data: {...}, success: true } or direct response
    return response.data.data || response.data;
  },
};

export default api;

