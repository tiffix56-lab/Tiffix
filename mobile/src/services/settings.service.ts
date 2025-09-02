import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types/auth.types';

export interface UserSettings {
  notifications: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    currency: string;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    dataSharing: boolean;
  };
}

class SettingsService {
  async getUserSettings(): Promise<ApiResponse<UserSettings>> {
    return await apiService.get<UserSettings>(API_ENDPOINTS.USER.PREFERENCES);
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse> {
    return await apiService.patch(API_ENDPOINTS.USER.PREFERENCES, settings);
  }
}

export const settingsService = new SettingsService();