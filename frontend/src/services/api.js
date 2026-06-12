import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const campaignsAPI = {
  list: () => api.get('/campaigns'),
  get: (id) => api.get(`/campaigns/${id}`),
  plan: (objective) => api.post('/campaigns/plan', { objective }),
  launch: (id) => api.post(`/campaigns/${id}/launch`),
  getTimeline: (id) => api.get(`/campaigns/${id}/timeline`),
  getSummary: (id) => api.get(`/campaigns/${id}/summary`),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
};

export const customersAPI = {
  list: (page = 1, pageSize = 20, search = null) => {
    const params = { page, page_size: pageSize };
    if (search) params.search = search;
    return api.get('/customers', { params });
  },
  get: (id) => api.get(`/customers/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentCampaigns: () => api.get('/dashboard/recent-campaigns'),
  getPerformance: () => api.get('/dashboard/performance'),
  getSuggestions: () => api.get('/dashboard/suggestions'),
};

export const receiptsAPI = {
  list: () => api.get('/receipts'),
  get: (id) => api.get(`/receipts/${id}`),
};

export const importAPI = {
  customers: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/customers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  orders: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/orders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getTemplates: () => api.get('/import/template'),
};

export default api;
