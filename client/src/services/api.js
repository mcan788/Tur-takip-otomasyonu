import axios from 'axios';

const isProd = window.location.hostname === 'zyronova.com';
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProd ? 'https://zyronova.com/api' : `http://${window.location.hostname}:3000/api`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek gönderilmeden önce token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt geldiğinde hata kontrolü yap
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Eğer hata login sayfasında geliyorsa yönlendirme yapma (hata mesajını görsün)
      if (!error.config.url.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('agencyId');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
