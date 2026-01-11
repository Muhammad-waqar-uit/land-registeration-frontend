import axios from 'axios';
import type { LoginCredentials, RegisterData, User, Land, Payment, Reservation } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create a separate axios instance for refresh token calls to avoid circular dependency
const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add error interceptor with refresh token logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Network Error - Backend not reachable:', API_BASE_URL);
      console.error('Make sure backend is running and CORS is enabled');
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      // If no refresh token, logout user
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        // Clear auth and redirect to home
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        // Call refresh token API using separate instance to avoid circular dependency
        const response = await refreshApi.post('/auth/refresh-token', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;

        // Update tokens in localStorage
        localStorage.setItem('token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Update Redux state (if store is available)
        try {
          const { updateTokensInStore } = await import('../utils/tokenRefresh');
          updateTokensInStore(accessToken, newRefreshToken);
        } catch (error) {
          // Ignore if store not available yet
        }

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Process queued requests
        processQueue(null, accessToken);
        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed - logout user
        isRefreshing = false;
        processQueue(refreshError, null);

        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Redirect to home
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    // Log other errors
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Auth API
// Backend returns direct responses: { user, token, accessToken, refreshToken } or { message } or User object
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string; accessToken?: string; refreshToken?: string }> => {
    const response = await api.post('/auth/login', credentials);
    // Backend returns: { user: User, token: string, accessToken: string, refreshToken: string }
    const responseData = response.data.data || response.data;
    
    // Store tokens (support both old and new format)
    const accessToken = responseData.accessToken || responseData.token;
    const refreshToken = responseData.refreshToken;
    
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    return {
      ...responseData,
      token: accessToken, // Ensure backward compatibility
    };
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string; accessToken?: string; refreshToken?: string }> => {
    const response = await api.post('/auth/register', data);
    // Backend returns: { user: User, token: string, accessToken: string, refreshToken: string }
    const responseData = response.data.data || response.data;
    
    // Store tokens (support both old and new format)
    const accessToken = responseData.accessToken || responseData.token;
    const refreshToken = responseData.refreshToken;
    
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    return {
      ...responseData,
      token: accessToken, // Ensure backward compatibility
    };
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    // Backend returns: { accessToken: string, refreshToken?: string } (if rotation enabled)
    const responseData = response.data.data || response.data;
    
    // Update tokens in localStorage
    if (responseData.accessToken) {
      localStorage.setItem('token', responseData.accessToken);
    }
    if (responseData.refreshToken) {
      localStorage.setItem('refreshToken', responseData.refreshToken);
    }
    
    return responseData;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    const tokenToRevoke = refreshToken || localStorage.getItem('refreshToken');
    
    // Clear tokens first
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Call logout API with refresh token (if available) to invalidate it on server
    if (tokenToRevoke) {
      try {
        await api.post('/auth/logout', { refreshToken: tokenToRevoke });
      } catch (error) {
        // Ignore logout API errors - tokens are already cleared locally
        console.warn('Logout API call failed, but tokens cleared locally');
      }
    } else {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Ignore logout API errors
        console.warn('Logout API call failed, but tokens cleared locally');
      }
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    // Backend returns: User object directly
    return response.data.data || response.data;
  },

  updateProfile: async (data: { name?: string; email?: string }): Promise<User> => {
    const response = await api.patch('/auth/profile', data);
    // Backend returns: User object directly
    return response.data.data || response.data;
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await api.patch('/auth/password', data);
    // Backend returns: { message: string }
    return response.data.data || response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string; resetToken?: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    // Backend returns: { message: string, resetToken?: string } (resetToken in dev mode)
    return response.data.data || response.data;
  },

  resetPassword: async (data: { token: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', data);
    // Backend returns: { message: string }
    return response.data.data || response.data;
  },
};

// Builder API
export const builderAPI = {
  getAll: async (verifiedOnly?: boolean): Promise<User[]> => {
    const params = verifiedOnly ? { verifiedOnly: true } : {};
    const response = await api.get('/builders', { params });
    // Backend returns array directly according to API docs
    return Array.isArray(response.data) ? response.data : (response.data.data || response.data);
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/builders/${id}`);
    return response.data.data || response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/builders/me');
    return response.data.data || response.data;
  },

  verify: async (id: string, remarks?: string): Promise<User> => {
    const response = await api.post(`/auth/builders/${id}/verify`, remarks ? { remarks } : {});
    // Backend returns object directly according to API docs
    return response.data;
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
  getAll: async (params?: LandQueryParams): Promise<Land[]> => {
    const response = await api.get('/lands', { params });
    // Backend returns: Land[] array directly
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Land> => {
    const response = await api.get(`/lands/${id}`);
    // Backend returns: Land object directly (may include owner object)
    return response.data.data || response.data;
  },

  create: async (landData: FormData): Promise<Land> => {
    const response = await api.post('/lands', landData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Backend returns: Land object directly
    return response.data.data || response.data;
  },

  update: async (id: string, landData: FormData): Promise<Land> => {
    const response = await api.patch(`/lands/${id}`, landData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Backend returns: Land object directly
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/lands/${id}`);
    // Backend returns: { message: string }
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
    // Backend returns: verification result object directly
    return response.data.data || response.data;
  },

  verifyBlockchain: async (id: string): Promise<{
    verified: boolean;
    message: string;
    databaseHash?: string;
    blockchainHash?: string;
    blockchainLandId?: number;
    error?: string | null;
  }> => {
    const response = await api.post(`/lands/${id}/verify-blockchain`);
    // Backend returns: blockchain verification result object directly
    return response.data.data || response.data;
  },
};

// Payment API
export const paymentAPI = {
  create: async (paymentData: FormData): Promise<Payment> => {
    const response = await api.post('/payments', paymentData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Backend returns: Payment object directly
    // FormData should include: landId, amount, dueDate (YYYY-MM-DD), paymentMode, transactionHash (optional), proof (file, optional)
    return response.data.data || response.data;
  },

  getByBuyer: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/my-payments');
    // Backend returns: Payment[] array directly (includes land object)
    return response.data.data || response.data;
  },

  verify: async (paymentId: string, verified: boolean, remarks?: string): Promise<Payment> => {
    const response = await api.post(`/payments/${paymentId}/verify`, { verified, remarks });
    // Backend returns: Payment object directly (status updated to 'verified' or 'rejected')
    return response.data.data || response.data;
  },

  getPending: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/pending');
    // Backend returns: Payment[] array directly (includes land and buyer objects)
    // Note: This endpoint is for Builder role - returns pending payments for builder's lands
    return response.data.data || response.data;
  },
};

// Reservation API
export const reservationAPI = {
  create: async (landId: string): Promise<Reservation> => {
    const response = await api.post('/reservations', { landId });
    // Backend returns: Reservation object directly
    return response.data.data || response.data;
  },

  getAll: async (): Promise<Reservation[]> => {
    const response = await api.get('/reservations');
    // Backend returns: Reservation[] array directly (includes land and buyer objects)
    // Buyers see only their own, admins see all
    return response.data.data || response.data;
  },

  cancel: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/reservations/${id}`);
    // Backend returns: { message: string }
    return response.data.data || response.data;
  },
};

// Contact API
export const contactAPI = {
  sendMessage: async (data: { name: string; email: string; message: string }): Promise<{ message: string }> => {
    const response = await api.post('/contact', data);
    // Backend returns: { message: string }
    return response.data.data || response.data;
  },
};

// Project API
export const projectAPI = {
  create: async (data: FormData): Promise<any> => {
    const response = await api.post('/projects', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },

  getAll: async (): Promise<any[]> => {
    const response = await api.get('/projects');
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await api.get(`/projects/${id}`);
    return response.data.data || response.data;
  },

  update: async (id: string, data: FormData): Promise<any> => {
    const response = await api.patch(`/projects/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  getProperties: async (id: string): Promise<any[]> => {
    const response = await api.get(`/projects/${id}/properties`);
    return response.data.data || response.data;
  },

  uploadDocs: async (id: string, formData: FormData): Promise<any> => {
    const response = await api.post(`/projects/${id}/approval-documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },
};

export default api;

