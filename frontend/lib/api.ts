/**
 * API Client
 * Centralized API communication with backend
 */

import axios from 'axios';
import Cookies from 'js-cookie';

// API URL Configuration
// Priority: 1. Environment variable, 2. Auto-detect production, 3. Localhost fallback
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Auto-detect if running in production (not localhost)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://uniapply-app.onrender.com/api';
  }
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config: any) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Log error for debugging
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        message: error.response.data?.message || error.message
      });
    } else if (error.request) {
      console.error('Network Error:', error.request);
      console.error('No response received from server. Is the backend running?');
    } else {
      console.error('Error:', error.message);
    }

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      Cookies.remove('token');
      Cookies.remove('userRole');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Applications API
export const applicationsAPI = {
  create: (data: any) => api.post('/applications', data),
  getAll: () => api.get('/applications'),
  getById: (id: string) => api.get(`/applications/${id}`),
  update: (id: string, data: any) => api.put(`/applications/${id}`, data),
  submit: (id: string) => api.post(`/applications/${id}/submit`),
};

// Documents API
export const documentsAPI = {
  upload: (formData: FormData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getByApplication: (applicationId: string) => api.get(`/documents/${applicationId}`),
};

// Admin API
export const adminAPI = {
  getApplications: (params?: any) => api.get('/admin/applications', { params }),
  getApplicationDetails: (id: string) => api.get(`/admin/applications/${id}`),
  verifyDocument: (id: string, data: any) => api.post(`/admin/documents/${id}/verify`, data),
  raiseIssue: (id: string, data: any) => api.post(`/admin/applications/${id}/raise-issue`, data),
  approveApplication: (id: string) => api.post(`/admin/applications/${id}/approve`),
  getAnalytics: () => api.get('/admin/analytics'),
  configureDocuments: (programId: string, data: any) => api.post(`/admin/programs/${programId}/documents`, data),
  getUniversities: () => api.get('/admin/universities'),
  getPrograms: (params?: any) => api.get('/admin/programs', { params }),
};

// Payments API
export const paymentsAPI = {
  createApplicationFee: (data: any) => api.post('/payments/application-fee', data),
  createIssueResolution: (data: any) => api.post('/payments/issue-resolution', data),
  verify: (data: any) => api.post('/payments/verify', data),
  getAll: () => api.get('/payments'),
};

// Support API
export const supportAPI = {
  createTicket: (data: any) => api.post('/support/tickets', data),
  getTickets: () => api.get('/support/tickets'),
  updateTicket: (id: string, data: any) => api.put(`/support/tickets/${id}`, data),
};

