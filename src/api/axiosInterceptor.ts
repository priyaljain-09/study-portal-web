import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';

// Base API URL for unprotected endpoints (login, school creation)
const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://euniiq.com/api';

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    const domain = localStorage.getItem('schoolDomain');
    const tenant = localStorage.getItem('tenant');
    
    // Check if this is an unprotected/auth request
    const isAuthRequest = 
      config.url?.includes('/auth/login') || 
      config.url?.includes('/schools/create') ||
      config.url?.includes('/users/login');

    // For unprotected APIs (login, school creation), always use base URL
    if (isAuthRequest) {
      config.baseURL = BASE_API_URL;
    } else if (domain) {
      // For protected APIs, use the school domain after login
      config.baseURL = `https://${domain}/api`;
    } else {
      // Fallback to base URL
      config.baseURL = BASE_API_URL;
    }

    // Add authorization token for protected requests
    if (token && !isAuthRequest && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant ID header for protected requests (backend uses this for routing)
    if (tenant && !isAuthRequest && config.headers) {
      config.headers['X-Tenant-ID'] = tenant;
    }

    // Add domain header for backend routing (if needed)
    if (domain && !isAuthRequest && config.headers) {
      config.headers['X-School-Domain'] = domain;
    }

    // Handle FormData - remove Content-Type header to let browser set it with boundary
    const isFormData = 
      config.data instanceof FormData ||
      (config.data && typeof config.data === 'object' && (config.data as any)._parts) ||
      (config.data && typeof config.data === 'object' && (config.data as any).append && typeof (config.data as any).append === 'function');
    
    if (isFormData && config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['Accept'];
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    
    if (status === 401) {
      // Clear stored tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('schoolDomain');
      localStorage.removeItem('tenant');
      localStorage.removeItem('schoolName');
      localStorage.removeItem('userRole');
      
      // Reset base URL
      axiosInstance.defaults.baseURL = BASE_API_URL;
      
      // Redirect to login
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const api = axiosInstance;
