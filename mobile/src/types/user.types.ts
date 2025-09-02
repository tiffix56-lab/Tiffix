export interface User {
  _id: string;
  email: string;
  phoneNumber?: string;
  fullName?: string;
  gender?: 'male' | 'female' | 'other';
  role: 'customer' | 'vendor' | 'admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profilePicture?: string;
  dateOfBirth?: string;
  referralCode: string;
  referredBy?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  profilePicture?: string;
}