import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('apaar_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
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
    return Promise.reject(error);
  }
);

// Backward-compatible ApiClient wrapper
export class ApiClient {
  static async request<T = any>(endpoint: string, options: any = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;
    const res = await api({
      url: endpoint,
      method: options.method || 'GET',
      data: options.body,
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return res.data;
  }

  static async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const res = await api.get(endpoint, { params });
    return res.data;
  }

  static async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const isFormData = data instanceof FormData;
    const res = await api.post(endpoint, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return res.data;
  }

  static async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const isFormData = data instanceof FormData;
    const res = await api.put(endpoint, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return res.data;
  }

  static async delete<T = any>(endpoint: string): Promise<T> {
    const res = await api.delete(endpoint);
    return res.data;
  }
}

export default api;
