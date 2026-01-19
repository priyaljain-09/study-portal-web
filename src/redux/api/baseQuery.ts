import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setShowToast } from '../slices/applicationSlice';

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://euniiq.com/api';

const baseQuery = fetchBaseQuery({
  baseUrl: '',
  prepareHeaders: (headers, { endpoint }) => {
    const token = localStorage.getItem('accessToken');
    const domain = localStorage.getItem('schoolDomain');
    const tenant = localStorage.getItem('tenant');
    
    // Set default headers
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    
    // Check if this is an auth request
    const isAuthRequest = 
      endpoint?.includes('/schools/create') || 
      endpoint?.includes('/users/login') ||
      endpoint?.includes('/auth/login');
    
    // Add authorization token only for non-auth requests
    if (token && !isAuthRequest) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Add tenant ID header for protected requests
    if (tenant && !isAuthRequest) {
      headers.set('X-Tenant-ID', tenant);
    }
    
    // Add domain header for backend routing
    if (domain && !isAuthRequest) {
      headers.set('X-School-Domain', domain);
    }
    
    return headers;
  },
});

export const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const domain = localStorage.getItem('schoolDomain');
  const token = localStorage.getItem('accessToken');
  
  // Handle both string URLs and object with url property
  const url = typeof args === 'string' ? args : args.url;
  
  // Check if this is an auth request
  const isAuthRequest = 
    url?.includes('/schools/create') || 
    url?.includes('/users/login') ||
    url?.includes('/auth/login');
  
  // Determine baseURL dynamically
  let baseURL: string;
  if (!isAuthRequest && domain) {
    baseURL = `https://${domain}/api`;
  } else {
    baseURL = BASE_API_URL;
  }
  
  // Handle FormData for file uploads
  if (args.formData && args.body instanceof FormData) {
    const fullUrl = baseURL + url;
    
    try {
      const response = await fetch(fullUrl, {
        method: args.method || 'POST',
        body: args.body,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || 'Something went wrong!';
        api.dispatch(
          setShowToast({
            show: true,
            type: 'error',
            toastMessage: errorMessage,
          }),
        );
        return { error: { status: response.status, data: errorData } };
      }

      const data = await response.json();
      api.dispatch(
        setShowToast({
          show: true,
          type: 'success',
          toastMessage: 'File uploaded successfully',
        }),
      );
      return { data };
    } catch (error: any) {
      const errorMessage = error?.message || 'Network error. Please check your connection and try again.';
      api.dispatch(
        setShowToast({
          show: true,
          type: 'error',
          toastMessage: errorMessage,
        }),
      );
      return { error: { status: 'FETCH_ERROR', error: errorMessage } };
    }
  }

  // Construct the full URL
  const fullUrl = baseURL + url;
  
  // Prepare args for baseQuery
  const queryArgs = typeof args === 'string' 
    ? { url: fullUrl }
    : { ...args, url: fullUrl };

  const result = await baseQuery(
    queryArgs,
    api,
    extraOptions,
  );

  // Handle errors (including 401)
  if (result.error) {
    const status = (result.error as any)?.status;
    
    // Handle 401 Unauthorized
    if (status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('schoolDomain');
      localStorage.removeItem('tenant');
      localStorage.removeItem('schoolName');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
      return result;
    }
    
    // Only show error toast for non-401 errors
    const errorMessage =
      (result.error as any)?.data?.detail ||
      (result.error as any)?.data?.message ||
      (result.error as any)?.error ||
      'Something went wrong!';
    
    // Don't show toast for network errors that might be temporary
    if (status !== 'FETCH_ERROR' && status !== 'PARSING_ERROR') {
      api.dispatch(
        setShowToast({
          show: true,
          type: 'error',
          toastMessage: errorMessage,
        }),
      );
    }
  }

  return result;
};






