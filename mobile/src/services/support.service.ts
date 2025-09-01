import { apiService } from './api.service';
import { ApiResponse } from '../types/auth.types';

export interface ComplaintData {
  complaintType: string;
  description: string;
}

export interface ContactData {
  name: string;
  email: string;
  mobileNumber: string;
  message: string;
}

class SupportService {
  async submitComplaint(data: ComplaintData): Promise<ApiResponse> {
    return await apiService.post('/support/complaint', data);
  }

  async submitContact(data: ContactData): Promise<ApiResponse> {
    return await apiService.post('/support/contact', data);
  }
}

export const supportService = new SupportService();