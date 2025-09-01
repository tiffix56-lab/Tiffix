import { apiService } from './api.service';
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
    return await apiService.get<UserSettings>('/user/settings');
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse> {
    return await apiService.put('/user/settings', settings);
  }
}

export const settingsService = new SettingsService();