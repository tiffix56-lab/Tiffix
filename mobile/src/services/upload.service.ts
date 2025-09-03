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
    console.log('📁 UploadService.uploadFile called', {
      fileType: file instanceof FormData ? 'FormData' : typeof file,
      category
    });
    
    let formData: FormData;
    
    if (file instanceof FormData) {
      formData = file;
      console.log('📦 Using provided FormData');
    } else {
      formData = new FormData();
      formData.append('file', file);
      if (category) {
        formData.append('category', category);
      }
      console.log('📦 Created new FormData with category:', category);
    }

    console.log('🌐 Calling API endpoint:', API_ENDPOINTS.UPLOAD.FILE);
    
    // Let React Native handle the Content-Type header for FormData automatically
    const response = await apiService.post<UploadResponse>(API_ENDPOINTS.UPLOAD.FILE, formData);
    
    console.log('📤 Upload service response:', response);
    return response;
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