export interface User {
  _id: string;
  email: string;
  phoneNumber?: string;
  name?: string;
  fullName?: string; // Keep for backward compatibility
  gender?: 'male' | 'female' | 'other';
  role: 'customer' | 'vendor' | 'admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profilePicture?: string;
  avatar?: string; // Backend might use avatar
  dateOfBirth?: string;
  referralCode: string;
  referredBy?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  avatar?: string;
  profilePicture?: string; // Keep for backward compatibility
}