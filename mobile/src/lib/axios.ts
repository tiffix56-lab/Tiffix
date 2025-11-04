import axios, { AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    console.log('🌐 [AXIOS] Request interceptor - starting...');
    console.log('🌐 [AXIOS] Request URL:', `${config.baseURL}${config.url}`);
    console.log('🌐 [AXIOS] Request method:', config.method?.toUpperCase());
    
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    console.log('🔑 [AXIOS] Token from storage:', token ? `${token.substring(0, 20)}...` : 'No token found');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.error('⚠️ [AXIOS] No authorization token - request will be unauthenticated');
    }
    
    if (config.data instanceof FormData) {

      delete config.headers['Content-Type'];
    }
    
    
    return config;
  },
  (error) => {
    console.error('❌ [AXIOS] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {

    
    return response;
  },
  async (error: AxiosError) => {
    console.error('❌ [AXIOS] Response interceptor - error');
    console.error('❌ [AXIOS] Error URL:', error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown URL');
    console.error('❌ [AXIOS] Error status:', error.response?.status);
    console.error('❌ [AXIOS] Error response:', error.response?.data);
    console.error('❌ [AXIOS] Error message:', error.message);
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest.headers._retry) {
      console.log('🔄 [AXIOS] 401 error - attempting token cleanup and retry');
      originalRequest.headers._retry = true;
      
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.USER_DATA,
          STORAGE_KEYS.REMEMBER_ME
        ]);
        
        console.log('🔄 [AXIOS] Auth data cleared, rejecting with session expired');
        return Promise.reject(new Error('Session expired'));
      } catch (clearError) {
        console.error('❌ [AXIOS] Failed to clear auth data:', clearError);
        return Promise.reject(error);
      }
    }

    if (!error.response) {
      console.error('❌ [AXIOS] No response received - network error');
      return Promise.reject(new Error('Please check your internet connection and try again'));
    }

    // Extract meaningful error message from response
    const responseData = error.response.data;
    let userFriendlyMessage = 'Something went wrong. Please try again.';

    if (responseData?.message) {
      userFriendlyMessage = responseData.message;
    } else if (responseData?.error) {
      userFriendlyMessage = typeof responseData.error === 'string' 
        ? responseData.error 
        : responseData.error.message || userFriendlyMessage;
    } else if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      const firstError = responseData.errors[0];
      userFriendlyMessage = typeof firstError === 'string' 
        ? firstError 
        : firstError.message || firstError.msg || userFriendlyMessage;
    }

    // Create new error with user-friendly message but preserve original error for debugging
    const enhancedError = new Error(userFriendlyMessage);
    (enhancedError as any).originalError = error;
    (enhancedError as any).response = error.response;

    console.error('❌ [AXIOS] Enhanced error message:', userFriendlyMessage);
    return Promise.reject(enhancedError);
  }
);

export default api;