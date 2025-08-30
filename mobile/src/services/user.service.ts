import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { User, UpdateUserProfileRequest } from '../types/user.types';
import { UserProfile } from '../types/address.types';
import { ApiResponse } from '../types/auth.types';

class UserService {
  async getUserProfile(): Promise<ApiResponse<{ userProfile: UserProfile }>> {
    return await apiService.get<{ userProfile: UserProfile }>(API_ENDPOINTS.USER.PROFILE);
  }

  async updateUserProfile(data: UpdateUserProfileRequest): Promise<ApiResponse<{ userProfile: UserProfile }>> {
    return await apiService.put<{ userProfile: UserProfile }>(API_ENDPOINTS.USER.PROFILE, data);
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return await apiService.get<{ user: User }>(API_ENDPOINTS.AUTH.ME);
  }

  async updatePreferences(preferences: {
    dietary?: string[];
    cuisineTypes?: string[];
    spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra-hot';
  }): Promise<ApiResponse<{ userProfile: UserProfile }>> {
    return await apiService.patch<{ userProfile: UserProfile }>(
      API_ENDPOINTS.USER.PREFERENCES,
      preferences
    );
  }
}

export const userService = new UserService();