export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'vendor' | 'admin';
  phoneNumber?: {
    countryCode: string;
    isoCode: string;
    internationalNumber: string;
  };
  avatar?: string;
  isAccountConfirmed: boolean;
  referralCode?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

export interface LoginCredentials {
  emailAddress: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  emailAddress: string;
  password: string;
  phoneNumber: string;
  referralCode?: string;
}

export interface VerifyEmailData {
  emailAddress: string;
  otp: string;
}

export interface ForgotPasswordData {
  emailAddress: string;
}

export interface ResetPasswordData {
  emailAddress: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    requiresVerification?: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface SocialLoginProvider {
  name: 'google' | 'facebook' | 'apple';
  displayName: string;
  icon: string;
}