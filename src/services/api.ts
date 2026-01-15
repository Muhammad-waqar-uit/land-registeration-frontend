import axios from 'axios';
import type { LoginCredentials, RegisterData, User, Land, Payment, Reservation, Project, PropertyRequest, Agreement, Installment, ResaleRequest, ProjectStatus } from '../types';

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
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
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
        } catch {
          // Ignore if store not available yet
        }

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Process queued requests
        processQueue(null, accessToken);
        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError: unknown) {
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
      } catch {
        // Ignore logout API errors - tokens are already cleared locally
        console.warn('Logout API call failed, but tokens cleared locally');
      }
    } else {
      try {
        await api.post('/auth/logout');
      } catch {
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
  create: async (data: Partial<Project>): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data.data || response.data;
  },

  getAll: async (params?: {
    status?: ProjectStatus;
    builderId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Project[]> => {
    const response = await api.get('/projects', params ? { params } : undefined);
    const payload = response.data;

    // Handles:
    // 1) Success wrapper: { data: Project[], success: true }
    // 2) Paginated (returned as-is): { data: Project[], total, page, limit }
    // 3) Direct array (legacy): Project[]
    const data = payload?.data ?? payload;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  getById: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data.data || response.data;
  },

  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await api.patch(`/projects/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  getProperties: async (id: string): Promise<Land[]> => {
    const response = await api.get(`/projects/${id}/properties`);
    return response.data.data || response.data;
  },

  getApprovalStatus: async (id: string): Promise<{
    projectId: string;
    status: ProjectStatus;
    isApproved: boolean;
    canCreateLands: boolean;
    totalUnits: number;
    landsCount: number;
    remainingUnits: number;
  }> => {
    const response = await api.get(`/projects/${id}/approval-status`);
    return response.data.data || response.data;
  },

  approve: async (id: string): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/approve`);
    return response.data.data || response.data;
  },

  uploadDocs: async (id: string, formData: FormData): Promise<Project> => {
    const response = await api.post(`/projects/${id}/approval-documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },

  verify: async (id: string): Promise<{
    verified: boolean;
    message: string;
    calculatedHash?: string;
    storedHash?: string;
    ipfsHash?: string;
  }> => {
    const response = await api.get(`/projects/${id}/verify`);
    return response.data.data || response.data;
  },

  verifyBlockchain: async (id: string): Promise<{
    verified: boolean;
    message: string;
    databaseHash?: string;
    blockchainHash?: string;
    error?: string | null;
  }> => {
    const response = await api.post(`/projects/${id}/verify-blockchain`);
    return response.data.data || response.data;
  },
};

// Property Request API
export const propertyRequestAPI = {
  // Create a new property request
  create: async (data: {
    propertyId: string;
    offerPrice?: number;
    message?: string;
  }): Promise<PropertyRequest> => {
    console.log('📤 Creating property request:', data);
    const response = await api.post('/property-requests', data);
    console.log('✅ Property request created:', response.data);
    return response.data.data || response.data;
  },

  // Get all property requests (Admin only)
  getAll: async (): Promise<PropertyRequest[]> => {
    const response = await api.get('/property-requests');
    return response.data.data || response.data;
  },

  // Get buyer's own requests
  getMyRequests: async (): Promise<PropertyRequest[]> => {
    const response = await api.get('/property-requests/my-requests');
    return response.data.data || response.data;
  },

  // Get pending requests for builder
  getPending: async (): Promise<PropertyRequest[]> => {
    const response = await api.get('/property-requests/pending');
    return response.data.data || response.data;
  },

  // Get single request by ID
  getById: async (id: string): Promise<PropertyRequest> => {
    const response = await api.get(`/property-requests/${id}`);
    return response.data.data || response.data;
  },

  // Respond to request (generic)
  respond: async (id: string, data: {
    status: 'approved' | 'rejected';
    response?: string;
  }): Promise<PropertyRequest> => {
    console.log(`📤 Responding to request ${id}:`, data);
    const response = await api.post(`/property-requests/${id}/respond`, data);
    console.log('✅ Request response sent:', response.data);
    return response.data.data || response.data;
  },

  // Approve request
  approve: async (id: string, response?: string): Promise<PropertyRequest> => {
    console.log(`✅ Approving request ${id}`);
    const res = await api.post(`/property-requests/${id}/approve`, { response });
    console.log('✅ Request approved:', res.data);
    return res.data.data || res.data;
  },

  // Reject request
  reject: async (id: string, response?: string): Promise<PropertyRequest> => {
    console.log(`❌ Rejecting request ${id}`);
    const res = await api.post(`/property-requests/${id}/reject`, { response });
    console.log('✅ Request rejected:', res.data);
    return res.data.data || res.data;
  },

  // Cancel/delete request
  delete: async (id: string): Promise<void> => {
    console.log(`🗑️ Cancelling request ${id}`);
    await api.delete(`/property-requests/${id}`);
    console.log('✅ Request cancelled');
  },
};

// Agreement API
export const agreementAPI = {
  // Create a new agreement (Builder only)
  create: async (data: {
    propertyId: string;
    buyerId: string;
    agreementType: 'initial' | 'final';
    terms: Record<string, unknown>;
  }): Promise<Agreement> => {
    console.log('📤 Creating agreement:', data);
    const response = await api.post('/agreements', data);
    console.log('✅ Agreement created:', response.data);
    return response.data.data || response.data;
  },

  // Get all agreements
  getAll: async (params?: {
    propertyId?: string;
    buyerId?: string;
    builderId?: string;
    status?: string;
    agreementType?: string;
  }): Promise<Agreement[]> => {
    const response = await api.get('/agreements', { params });
    return response.data.data || response.data;
  },

  // Get agreement by ID
  getById: async (id: string): Promise<Agreement> => {
    const response = await api.get(`/agreements/${id}`);
    return response.data.data || response.data;
  },

  // Get agreements by property ID
  getByProperty: async (propertyId: string): Promise<Agreement[]> => {
    const response = await api.get(`/agreements/property/${propertyId}`);
    return response.data.data || response.data;
  },

  // Sign agreement (Buyer or Builder)
  sign: async (id: string, signatureData?: string): Promise<Agreement> => {
    console.log(`✍️ Signing agreement ${id}`);
    const response = await api.post(`/agreements/${id}/sign`, { signatureData });
    console.log('✅ Agreement signed:', response.data);
    return response.data.data || response.data;
  },

  // Upload signed document
  uploadSigned: async (id: string, document: File): Promise<Agreement> => {
    console.log(`📤 Uploading signed document for agreement ${id}`);
    const formData = new FormData();
    formData.append('document', document);
    
    const response = await api.post(`/agreements/${id}/upload-signed`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('✅ Signed document uploaded:', response.data);
    return response.data.data || response.data;
  },

  // Generate ownership document (Builder only)
  generateOwnership: async (id: string): Promise<Agreement> => {
    console.log(`📄 Generating ownership document for agreement ${id}`);
    const response = await api.post(`/agreements/${id}/generate-ownership-doc`);
    console.log('✅ Ownership document generated:', response.data);
    return response.data.data || response.data;
  },

  // Verify agreement
  verify: async (id: string): Promise<{ verified: boolean; message: string }> => {
    console.log(`🔍 Verifying agreement ${id}`);
    const response = await api.post(`/agreements/${id}/verify`);
    console.log('✅ Agreement verified:', response.data);
    return response.data.data || response.data;
  },
};

// Installment API
export const installmentAPI = {
  // Create installments from agreement (Builder only)
  create: async (agreementId: string): Promise<Installment[]> => {
    console.log(`💰 Creating installments for agreement ${agreementId}`);
    const response = await api.post('/installments', { agreementId });
    console.log('✅ Installments created:', response.data);
    return response.data.data || response.data;
  },

  // Get all installments with filters
  getAll: async (params?: {
    landId?: string;
    agreementId?: string;
    buyerId?: string;
    status?: 'pending' | 'paid' | 'overdue' | 'completed';
    page?: number;
    limit?: number;
  }): Promise<Installment[]> => {
    console.log('📤 Fetching installments with params:', params);
    const response = await api.get('/installments', { params });
    console.log('✅ Installments fetched:', response.data);
    return response.data.data || response.data;
  },

  // Get my installments (Buyer)
  getMyInstallments: async (params?: { status?: string }): Promise<Installment[]> => {
    console.log('📤 Fetching my installments with params:', params);
    const response = await api.get('/installments/my-installments', { params });
    console.log('✅ My installments fetched:', response.data);
    return response.data.data || response.data;
  },

  // Get installment by ID
  getById: async (id: string): Promise<Installment> => {
    console.log(`📤 Fetching installment ${id}`);
    const response = await api.get(`/installments/${id}`);
    console.log('✅ Installment fetched:', response.data);
    return response.data.data || response.data;
  },

  // Get installment status
  getStatus: async (id: string): Promise<{ status: string; message: string }> => {
    console.log(`📤 Fetching installment status ${id}`);
    const response = await api.get(`/installments/${id}/status`);
    console.log('✅ Installment status fetched:', response.data);
    return response.data.data || response.data;
  },

  // Update overdue installments (Admin only)
  updateOverdue: async (): Promise<{ updated: number; message: string }> => {
    console.log('💰 Updating overdue installments');
    const response = await api.post('/installments/update-overdue');
    console.log('✅ Overdue installments updated:', response.data);
    return response.data.data || response.data;
  },
};

// Resale Request API
export const resaleRequestAPI = {
  // Create resale request
  create: async (data: { propertyId: string; requestedPrice: number }): Promise<ResaleRequest> => {
    console.log('🔄 Creating resale request:', data);
    const response = await api.post('/resale-requests', data);
    console.log('✅ Resale request created:', response.data);
    return response.data.data || response.data;
  },

  // Get all resale requests (Admin)
  getAll: async (params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'listed' | 'sold';
    propertyId?: string;
    page?: number;
    limit?: number;
  }): Promise<ResaleRequest[]> => {
    console.log('📤 Fetching all resale requests with params:', params);
    const response = await api.get('/resale-requests', { params });
    console.log('✅ Resale requests fetched:', response.data);
    return response.data.data || response.data;
  },

  // Get my resale requests
  getMyRequests: async (): Promise<ResaleRequest[]> => {
    console.log('📤 Fetching my resale requests');
    const response = await api.get('/resale-requests/my-requests');
    console.log('✅ My resale requests fetched:', response.data);
    return response.data.data || response.data;
  },

  // Get builder's resale requests
  getBuilder: async (params?: { status?: string }): Promise<ResaleRequest[]> => {
    console.log('📤 Fetching builder resale requests with params:', params);
    const response = await api.get('/resale-requests/builder', { params });
    console.log('✅ Builder resale requests fetched:', response.data);
    return response.data.data || response.data;
  },

  // Get resale request by ID
  getById: async (id: string): Promise<ResaleRequest> => {
    console.log(`📤 Fetching resale request ${id}`);
    const response = await api.get(`/resale-requests/${id}`);
    console.log('✅ Resale request fetched:', response.data);
    return response.data.data || response.data;
  },

  // Respond to resale request (Builder)
  respond: async (id: string, status: 'approved' | 'rejected'): Promise<ResaleRequest> => {
    console.log(`🔄 Responding to resale request ${id} with status:`, status);
    const response = await api.post(`/resale-requests/${id}/respond`, { status });
    console.log('✅ Resale request response sent:', response.data);
    return response.data.data || response.data;
  },

  // Approve resale request
  approve: async (id: string): Promise<ResaleRequest> => {
    console.log(`✅ Approving resale request ${id}`);
    const response = await api.post(`/resale-requests/${id}/approve`);
    console.log('✅ Resale request approved:', response.data);
    return response.data.data || response.data;
  },

  // Reject resale request
  reject: async (id: string): Promise<ResaleRequest> => {
    console.log(`❌ Rejecting resale request ${id}`);
    const response = await api.post(`/resale-requests/${id}/reject`);
    console.log('✅ Resale request rejected:', response.data);
    return response.data.data || response.data;
  },

  // List property as resale
  list: async (id: string): Promise<ResaleRequest> => {
    console.log(`📋 Listing resale request ${id}`);
    const response = await api.post(`/resale-requests/${id}/list`);
    console.log('✅ Resale request listed:', response.data);
    return response.data.data || response.data;
  },

  // Mark resale as sold
  markSold: async (id: string): Promise<ResaleRequest> => {
    console.log(`💰 Marking resale request ${id} as sold`);
    const response = await api.post(`/resale-requests/${id}/mark-sold`);
    console.log('✅ Resale request marked as sold:', response.data);
    return response.data.data || response.data;
  },
};

// Token API
export const tokenAPI = {
  // Get token balance for a wallet address
  getBalance: async (address: string): Promise<{
    success: boolean;
    data?: {
      success: boolean;
      balance: string;
      balanceRaw: string;
      decimals: number;
    };
    balance?: string;
    balanceRaw?: string;
    decimals?: number;
    error?: string;
  }> => {
    console.log(`🪙 Getting token balance for address: ${address}`);
    const response = await api.get(`/tokens/balance?address=${address}`);
    console.log('✅ Token balance retrieved:', response.data);
    return response.data;
  },

  // Mint tokens to an address (Admin only)
  mintTokens: async (toAddress: string, amount: number): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> => {
    console.log(`🪙 Minting ${amount} tokens to ${toAddress}`);
    const response = await api.post('/tokens/mint', {
      toAddress,
      amount
    });
    console.log('✅ Tokens minted successfully:', response.data);
    return response.data;
  },
};

export default api;

