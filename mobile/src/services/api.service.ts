import { AxiosResponse } from 'axios';
import api from '../lib/axios';
import { ApiResponse } from '../types/auth.types';
import { ErrorHandler } from '../utils/error.handler';

const errorHandler = new ErrorHandler();

class ApiService {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await api.get(url);
      return {
        success: true,
        message: response.data.message || 'Success',
        data: response.data.data || response.data,
      };
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await api.post(url, data);
      return {
        success: true,
        message: response.data.message || 'Success',
        data: response.data.data || response.data,
      };
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await api.put(url, data);
      return {
        success: true,
        message: response.data.message || 'Success',
        data: response.data.data || response.data,
      };
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await api.patch(url, data);
      return {
        success: true,
        message: response.data.message || 'Success',
        data: response.data.data || response.data,
      };
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await api.delete(url);
      return {
        success: true,
        message: response.data.message || 'Success',
        data: response.data.data || response.data,
      };
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  }
}

export const apiService = new ApiService();