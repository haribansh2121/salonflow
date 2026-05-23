import axios from 'axios';

axios.post('/api/auth/login', data)

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const branchId = localStorage.getItem('currentBranchId');
    if (branchId) {
      config.headers['X-Branch-Id'] = branchId;
    }
  }
  return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── API Modules ──
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const servicesAPI = {
  getAll: () => api.get('/services'),
  create: (data: any) => api.post('/services', data),
  update: (id: number, data: any) => api.put(`/services/${id}`, data),
  delete: (id: number) => api.delete(`/services/${id}`),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const billsAPI = {
  getAll: (params?: any) => api.get('/bills', { params }),
  create: (data: any) => api.post('/bills', data),
  updateStatus: (id: number, status: string) => api.patch(`/bills/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/bills/${id}`),
};

export const customersAPI = {
  getAll: (search?: string) => api.get('/customers', { params: { search } }),
  create: (data: any) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

export const appointmentsAPI = {
  getAll: (params?: any) => api.get('/appointments', { params }),
  create: (data: any) => api.post('/appointments', data),
  updateStatus: (id: number, status: string) => api.patch(`/appointments/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/appointments/${id}`),
};

export const staffAPI = {
  getAll: () => api.get('/staff'),
  create: (data: any) => api.post('/staff', data),
  update: (id: number, data: any) => api.put(`/staff/${id}`, data),
  delete: (id: number) => api.delete(`/staff/${id}`),
};

export const reportsAPI = {
  getSummary: (params: any) => api.get('/reports/summary', { params }),
  getStaffWise: (params: any) => api.get('/reports/staff-wise', { params }),
  getServiceWise: () => api.get('/reports/service-wise'),
  getProductWise: () => api.get('/reports/product-wise'),
  getCustomerWise: () => api.get('/reports/customer-wise'),
  getPaymentStats: () => api.get('/reports/payment-methods'),
  getAppointmentStats: () => api.get('/reports/appointment-stats'),
};

export const analyticsAPI = {
  get: () => api.get('/analytics'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  testEmail: () => api.post('/settings/test-email'),
};

export const branchesAPI = {
  getAll: () => api.get('/branches'),
  create: (data: any) => api.post('/branches', data),
  update: (id: number, data: any) => api.put(`/branches/${id}`, data),
  delete: (id: number) => api.delete(`/branches/${id}`),
};

export const marketingAPI = {
  getCampaigns: () => api.get('/marketing/campaigns'),
  sendCampaign: (data: any) => api.post('/marketing/send', data),
};

export const publicAPI = {
  getInfo: (tenantId: string) => axios.get(`${API_BASE}/public/${tenantId}/info`),
  book: (tenantId: string, data: any) => axios.post(`${API_BASE}/public/${tenantId}/book`, data),
};

export default api;
