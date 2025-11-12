import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { API_BASE_URL } from '../constants/config';
import {
  LoginCredentials,
  RegisterCredentials,
  VerifyEmailData,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
  AuthResponse,
  ApiResponse,
  LocationData,
  User,
} from '../types/auth.types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<{ accessToken: string; user: User }>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    return {
      success: response.success,
      message: response.message,
      data: response.data ? {
        user: response.data.user,
        accessToken: response.data.accessToken,
      } : undefined,
    };
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    console.log('Auth service - sending registration data:', JSON.stringify(credentials, null, 2));
    
    const response = await apiService.post<{ user: User; requiresVerification: boolean }>(
      API_ENDPOINTS.AUTH.REGISTER,
      credentials
    );
    
    console.log('Auth service - received response:', JSON.stringify(response, null, 2));
    
    return {
      success: response.success,
      message: response.message,
      data: response.data ? {
        user: response.data.user,
        accessToken: '',
        requiresVerification: response.data.requiresVerification,
      } : undefined,
    };
  }

  async verifyEmail(data: VerifyEmailData): Promise<AuthResponse> {
    const response = await apiService.post<{ accessToken: string; user: User }>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      data
    );
    
    return {
      success: response.success,
      message: response.message,
      data: response.data ? {
        user: response.data.user,
        accessToken: response.data.accessToken,
      } : undefined,
    };
  }

  async resendOTP(emailAddress: string): Promise<ApiResponse> {
    return await apiService.post(API_ENDPOINTS.AUTH.RESEND_OTP, { emailAddress });
  }

  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse> {
    return await apiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  }

  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    return await apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    return await apiService.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return await apiService.get<{ user: User }>(API_ENDPOINTS.AUTH.ME);
  }

  async logout(): Promise<ApiResponse> {
    return await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  async updateLocation(locationData: LocationData): Promise<ApiResponse> {
    return await apiService.put(API_ENDPOINTS.AUTH.LOCATION, locationData);
  }

  async getLocation(): Promise<ApiResponse<{ location: LocationData; hasLocation: boolean }>> {
    return await apiService.get<{ location: LocationData; hasLocation: boolean }>(
      API_ENDPOINTS.AUTH.LOCATION
    );
  }

  async getSocialLoginUrl(provider: 'google' | 'facebook'): Promise<string> {
    return `${API_BASE_URL}${provider === 'google' ? API_ENDPOINTS.AUTH.GOOGLE : API_ENDPOINTS.AUTH.FACEBOOK}`;
  }

  async deleteAccount(): Promise<ApiResponse> {
    return await apiService.post(API_ENDPOINTS.AUTH.DELETE_ACCOUNT);
  }
}

export const authService = new AuthService();