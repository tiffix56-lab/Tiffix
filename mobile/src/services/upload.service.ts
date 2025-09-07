import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types/auth.types';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

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

// Utility function to append cache buster to URL
const appendCacheBuster = (url: string): string => {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${Date.now()}`;
};

class UploadService {
  async uploadImageFromPicker(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Limited functionality', 'Image picker is limited in web browser');
        return null;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return null;

      const selectedImage = result.assets[0];
      return await this.uploadImageAsset(selectedImage);
    } catch (error) {
      console.error('Image picker error:', error);
      throw error;
    }
  }

  async uploadImageAsset(selectedImage: ImagePicker.ImagePickerAsset): Promise<string> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!token) {
        throw new Error('Authentication token missing');
      }

      const formData = new FormData();
      const uri = Platform.OS === 'ios' ? selectedImage.uri.replace('file://', '') : selectedImage.uri;
      const fileNameMatch = uri.match(/[^\/]+$/);
      const fileName = fileNameMatch ? fileNameMatch[0] : 'upload.jpg';

      const fileObject = {
        uri: uri,
        name: fileName,
        type: 'image/jpeg',
      };

      formData.append('file', fileObject as any);
      formData.append('category', 'profile');

      const response = await axios.post('/upload-file', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
      });

      const imageUrl = response.data.data?.url || response.data.url || response.data.data;
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid response format from server');
      }

      return appendCacheBuster(imageUrl);
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  async uploadFile(file: File | Blob | FormData, category?: string): Promise<ApiResponse<UploadResponse>> {
    console.log('📁 UploadService.uploadFile called', {
      fileType: file instanceof FormData ? 'FormData' : typeof file,
      category
    });
    
    let formData: FormData;
    
    if (file instanceof FormData) {
      formData = file;
      console.log('📦 Using provided FormData');
      
      if (__DEV__) {
        try {
          console.log('📦 FormData entries:');
          // @ts-ignore - FormData._parts is React Native specific
          if (formData._parts) {
            // @ts-ignore
            formData._parts.forEach(([key, value]) => {
              console.log(`  ${key}:`, typeof value === 'object' ? 'File/Object' : value);
            });
          }
        } catch (e) {
          console.log('📦 Could not log FormData entries');
        }
      }
    } else {
      formData = new FormData();
      formData.append('file', file);
      if (category) {
        formData.append('category', category);
      }
      console.log('📦 Created new FormData with category:', category);
    }

    console.log('🌐 Calling API endpoint:', API_ENDPOINTS.UPLOAD.FILE);
    
    // Use specific config for file uploads to ensure proper handling
    const response = await apiService.post<UploadResponse>(
      API_ENDPOINTS.UPLOAD.FILE, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout for file uploads
      }
    );
    
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