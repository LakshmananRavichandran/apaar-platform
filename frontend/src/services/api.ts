import axios from 'axios';
import { handleMockRoute } from './mockApi';

export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('apaar_api_url');
    if (customUrl) return customUrl.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/+$/, '');
  }
  if (typeof window === 'undefined') return 'http://localhost:8000/api/v1';

  // If Vite dev server (port 5173), route to the current machine's port 8000
  if (window.location.port === '5173') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }

  // If running unified on port 8000, 3000, localtunnel, or cloud domain
  return `${window.location.protocol}//${window.location.host}/api/v1`;
};

export const API_BASE = getApiBase();

export const setCustomApiUrl = (url: string | null) => {
  if (typeof window === 'undefined') return;
  if (!url) {
    localStorage.removeItem('apaar_api_url');
  } else {
    localStorage.setItem('apaar_api_url', url.trim().replace(/\/+$/, ''));
  }
  window.location.reload();
};

export const getDownloadUrl = (path: string): string => {
  const base = getApiBase();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request interceptor to add bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('apaar_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 refresh AND fallback to mock preview if offline
api.interceptors.response.use(
  (response) => {
    // If Vercel SPA rewrite returned HTML index for an API route
    if (
      typeof response.data === 'string' &&
      response.data.trim().startsWith('<!DOCTYPE') &&
      response.config.url?.includes('/')
    ) {
      console.warn('[APAAR Verify] API returned HTML (SPA Rewrite). Serving mock fallback for:', response.config.url);
      const mock = handleMockRoute(response.config.url || '', response.config.method?.toUpperCase() || 'GET', response.config.data);
      return {
        ...response,
        data: mock,
        status: 200,
      };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Token Refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('apaar_refresh_token');
      if (refreshToken && !originalRequest.url?.includes('/auth/refresh') && !originalRequest.url?.includes('/auth/login')) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
          const newAccessToken = res.data.access_token;
          localStorage.setItem('apaar_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('apaar_access_token');
          localStorage.removeItem('apaar_refresh_token');
          localStorage.removeItem('apaar_user');
          window.location.href = '/login';
        }
      }
    }

    // Graceful Fallback for Vercel Preview / Offline Backend
    const isNetworkErr = !error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
    const isNotFoundOrServerErr = error.response?.status === 404 || error.response?.status === 502 || error.response?.status === 504;

    if (originalRequest && (isNetworkErr || isNotFoundOrServerErr)) {
      console.warn(`[APAAR Verify] Backend offline or unreachable (${error.message}). Serving standalone demo fallback:`, originalRequest.url);
      const mockData = handleMockRoute(
        originalRequest.url || '',
        originalRequest.method?.toUpperCase() || 'GET',
        originalRequest.data
      );
      return {
        data: mockData,
        status: 200,
        statusText: 'OK (Mock Demo Fallback)',
        headers: {},
        config: originalRequest,
      };
    }

    return Promise.reject(error);
  }
);

// Backward-compatible ApiClient wrapper
export class ApiClient {
  static async request<T = any>(endpoint: string, options: any = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;
    try {
      const res = await api({
        url: endpoint,
        method: options.method || 'GET',
        data: options.body,
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return res.data;
    } catch (err: any) {
      console.warn('[ApiClient] Request failed, using mock route fallback:', endpoint);
      return handleMockRoute(endpoint, options.method || 'GET', options.body) as T;
    }
  }

  static async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const res = await api.get(endpoint, { params });
      return res.data;
    } catch (err: any) {
      return handleMockRoute(endpoint, 'GET', params) as T;
    }
  }

  static async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const isFormData = data instanceof FormData;
    try {
      const res = await api.post(endpoint, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return res.data;
    } catch (err: any) {
      return handleMockRoute(endpoint, 'POST', data) as T;
    }
  }

  static async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const isFormData = data instanceof FormData;
    try {
      const res = await api.put(endpoint, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return res.data;
    } catch (err: any) {
      return handleMockRoute(endpoint, 'PUT', data) as T;
    }
  }

  static async delete<T = any>(endpoint: string): Promise<T> {
    try {
      const res = await api.delete(endpoint);
      return res.data;
    } catch (err: any) {
      return handleMockRoute(endpoint, 'DELETE') as T;
    }
  }
}

export default api;
