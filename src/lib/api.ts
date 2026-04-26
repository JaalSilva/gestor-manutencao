import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Resilient Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Robust parsing
    const { data } = response;
    if (data && typeof data === 'object' && data.success !== undefined) {
      if (!data.success) {
        return Promise.reject(new Error(data.error || 'Erro desconhecido na API'));
      }
      return data.data;
    }
    return { success: true, data };
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { data } = error.response;
      const errorMessage = data?.error || error.message || 'Erro de rede ou servidor';
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // The request was made but no response was received (e.g. timeout)
      return Promise.reject(new Error('O servidor não respondeu. Verifique sua conexão.'));
    } else {
      return Promise.reject(new Error(error.message));
    }
  }
);

export default api;
