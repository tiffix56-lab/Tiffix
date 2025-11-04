import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types/auth.types';

export interface ComplaintData {
  title: string;
  reason: string;
  name: string;
  phoneNumber: string;
}

export interface ContactData {
  name: string;
  email: string;
  mobileNumber: string;
  message: string;
}

class SupportService {
  async submitComplaint(data: ComplaintData): Promise<ApiResponse> {
    return await apiService.post('/complains', data);
  }

  async submitContact(data: ContactData): Promise<ApiResponse> {
    // Map mobileNumber to phoneNumber for backend compatibility
    const payload = {
      name: data.name,
      email: data.email,
      phoneNumber: data.mobileNumber,
      message: data.message
    };
    return await apiService.post('/contacts', payload);
  }
}

export const supportService = new SupportService();