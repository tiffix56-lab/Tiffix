import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types/auth.types';

export interface UploadResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  filePath: string;
  size: number;
  fileType: string;
  tags: string[];
  customMetadata: any;
}

export interface UploadRequest {
  file: File | Blob;
  category: string;
}

class UploadService {
  async uploadFile(file: File | Blob | FormData, category?: string): Promise<ApiResponse<UploadResponse>> {
    let formData: FormData;
    
    if (file instanceof FormData) {
      formData = file;
    } else {
      formData = new FormData();
      formData.append('file', file);
      if (category) {
        formData.append('category', category);
      }
    }

    return await apiService.post<UploadResponse>(API_ENDPOINTS.UPLOAD.FILE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async uploadProfilePhoto(file: File | Blob | FormData): Promise<ApiResponse<UploadResponse>> {
    if (file instanceof FormData) {
      return this.uploadFile(file);
    }
    return this.uploadFile(file, 'profile');
  }

  async uploadMenuPhoto(file: File | Blob): Promise<ApiResponse<UploadResponse>> {
    return this.uploadFile(file, 'menu');
  }

  async uploadDocumentPhoto(file: File | Blob): Promise<ApiResponse<UploadResponse>> {
    return this.uploadFile(file, 'document');
  }
}

export const uploadService = new UploadService();