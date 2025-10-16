import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_SERVER_URL;
if (!baseURL) {
  throw new Error(`VITE_SERVER_URL environment variable is not defined ${baseURL}`);
}

const servicesAxiosInstance = axios.create({
  baseURL: baseURL
});

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