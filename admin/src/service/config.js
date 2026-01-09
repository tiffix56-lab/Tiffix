import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_SERVER_URL;
if (!baseURL) {
  throw new Error(`VITE_SERVER_URL environment variable is not defined ${baseURL}`);
}

const servicesAxiosInstance = axios.create({
  baseURL: baseURL
});

servicesAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }

    return Promise.reject(new Error('An unknown error occurred'));
  }
);


servicesAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (error instanceof AxiosError) {
      return Promise.reject(new Error(error.message || 'Request failed'));
    }
    return Promise.reject(new Error('An unknown error occurred'));
  }
);


export {
  servicesAxiosInstance,
  baseURL
};