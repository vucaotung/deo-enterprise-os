import { AxiosError } from 'axios';
import api from '../api/client';

/**
 * Legacy compatibility layer.
 *
 * Canonical target for v0.3.0 is: ../api/client
 * This file stays temporarily so older auth flow code importing `@/lib/api`
 * keeps working while the import graph is cleaned up.
 */

const legacyToken = localStorage.getItem('auth_token');
const currentToken = localStorage.getItem('token');

if (!currentToken && legacyToken) {
  localStorage.setItem('token', legacyToken);
}

export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('token', token);
};

export const clearAuthToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
