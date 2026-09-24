import axios from 'axios';

// Base API instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token if present
API.interceptors.request.use(
  (config) => {
    const userInfo = sessionStorage.getItem('seller_user') || localStorage.getItem('seller_user');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle unauthenticated responses
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear storage if session expired or unauthorized
      sessionStorage.removeItem('seller_user');
      localStorage.removeItem('seller_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// REST API Service Methods
export const authService = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (data) => API.post('/auth/register', data),
  getProfile: () => API.get('/auth/profile')
};

export const adminService = {
  getSellers: (params) => API.get('/admin/sellers', { params }),
  updateSellerVerification: (id, isVerified) => API.put(`/admin/sellers/${id}/verification`, { isVerified }),
  getStats: () => API.get('/admin/stats'),
  deleteSeller: (id) => API.delete(`/admin/sellers/${id}`)
};

export const productService = {
  getAll: (params) => API.get('/products', { params }),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`)
};

export const orderService = {
  getAll: (params) => API.get('/orders', { params }),
  getById: (id) => API.get(`/orders/${id}`),
  create: (data) => API.post('/orders', data),
  updateStatus: (id, status) => API.put(`/orders/${id}`, { status }),
  delete: (id) => API.delete(`/orders/${id}`)
};

export const customerService = {
  getAll: (params) => API.get('/customers', { params }),
  getById: (id) => API.get(`/customers/${id}`),
  create: (data) => API.post('/customers', data),
  delete: (id) => API.delete(`/customers/${id}`)
};

export const salesService = {
  getSummary: () => API.get('/sales/summary')
};

export default API;
