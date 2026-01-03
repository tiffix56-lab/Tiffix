import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { storageService } from '../services/storage.service';
import {
  AuthState,
  User,
  LoginCredentials,
  RegisterCredentials,
  VerifyEmailData,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData
} from '../types/auth.types';
import Toast from 'react-native-toast-message';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  googleLogin: (idToken: string) => Promise<{ success: boolean; message: string; needsProfileCompletion?: boolean }>;
  appleLogin: (idToken: string, firstName?: string | null, lastName?: string | null) => Promise<{ success: boolean; message: string; needsProfileCompletion?: boolean }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message: string; requiresVerification?: boolean }>;
  verifyEmail: (data: VerifyEmailData) => Promise<{ success: boolean; message: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (data: ForgotPasswordData) => Promise<{ success: boolean; message: string }>;
  resetPassword: (data: ResetPasswordData) => Promise<{ success: boolean; message: string }>;
  changePassword: (data: ChangePasswordData) => Promise<{ success: boolean; message: string }>;
  deleteAccount: () => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  needsPhoneNumber: () => boolean;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };

    case 'LOGIN_SUCCESS':
      console.log('🔐 [AUTH_REDUCER] LOGIN_SUCCESS dispatched:', {
        userName: action.payload.user.name,
        userEmail: action.payload.user.email,
        wasAuthenticated: state.isAuthenticated
      });
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case 'UPDATE_USER':
      console.log('🔄 [AUTH_REDUCER] UPDATE_USER dispatched:', {
        userName: action.payload.name,
        userEmail: action.payload.email
      });
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const initializeAuth = async () => {
    try {
      const token = await storageService.getToken();
      const user = await storageService.getUserData();
      
      if (token && user) {
        const profileResponse = await authService.getProfile();
        console.log("PROFILE RES", profileResponse);
        
        if (profileResponse.success && profileResponse.data) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: profileResponse.data.user, token },
          });
        } else {
          await storageService.clearAuthData();
        }
      }
    } catch (error) {
      await storageService.clearAuthData();
    } finally {
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        await storageService.setToken(response.data.accessToken);
        await storageService.setUserData(response.data.user);

        if (credentials.rememberMe) {
          await storageService.setRememberMe(true);
        }

        initializeAuth();

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Logged in successfully',
        });

        return { success: true, message: response.message };
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: response.message,
        });

        return { success: false, message: response.message };
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'Something went wrong',
      });

      return { success: false, message: 'Login failed' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const googleLogin = async (idToken: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authService.googleMobileLogin(idToken);

      if (response.success && response.data) {
        await storageService.setToken(response.data.accessToken);
        await storageService.setUserData(response.data.user);

        // Save needsProfileCompletion flag to storage
        if (response.data.needsProfileCompletion) {
          await storageService.setNeedsProfileCompletion(true);
        } else {
          await storageService.removeNeedsProfileCompletion();
        }

        initializeAuth();

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Logged in with Google successfully',
        });

        return {
          success: true,
          message: response.message,
          needsProfileCompletion: response.data.needsProfileCompletion
        };
      } else {
        Toast.show({
          type: 'error',
          text1: 'Google Login Failed',
          text2: response.message,
        });

        return { success: false, message: response.message };
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Google Login Failed',
        text2: 'Something went wrong',
      });

      return { success: false, message: 'Google login failed' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const appleLogin = async (idToken: string, firstName?: string | null, lastName?: string | null) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authService.appleMobileLogin(idToken, firstName, lastName);

      if (response.success && response.data) {
        await storageService.setToken(response.data.accessToken);
        await storageService.setUserData(response.data.user);

        // Save needsProfileCompletion flag to storage
        if (response.data.needsProfileCompletion) {
          await storageService.setNeedsProfileCompletion(true);
        } else {
          await storageService.removeNeedsProfileCompletion();
        }

        initializeAuth();

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Logged in with Apple successfully',
        });

        return {
          success: true,
          message: response.message,
          needsProfileCompletion: response.data.needsProfileCompletion
        };
      } else {
        Toast.show({
          type: 'error',
          text1: 'Apple Login Failed',
          text2: response.message,
        });

        return { success: false, message: response.message };
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Apple Login Failed',
        text2: 'Something went wrong',
      });

      return { success: false, message: 'Apple login failed' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('Registration credentials:', JSON.stringify(credentials, null, 2));
      const response = await authService.register(credentials);
      console.log('Registration response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Registration Successful',
          text2: response.message,
        });
        
        return { 
          success: true, 
          message: response.message,
          requiresVerification: response.data?.requiresVerification 
        };
      } else {
        console.error('Registration failed with response:', response);
        Toast.show({
          type: 'error',
          text1: 'Registration Failed',
          text2: response.message,
        });
        
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration error (catch block):', error);
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: 'Something went wrong',
      });
      
      return { success: false, message: 'Registration failed' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const verifyEmail = async (data: VerifyEmailData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await authService.verifyEmail(data);
      
      if (response.success && response.data) {
        await storageService.setToken(response.data.accessToken);
        await storageService.setUserData(response.data.user);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: response.data.user, token: response.data.accessToken },
        });
        
        Toast.show({
          type: 'success',
          text1: 'Verification Successful',
          text2: response.message,
        });
        
        return { success: true, message: response.message };
      } else {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: response.message,
        });
        
        return { success: false, message: response.message };
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: 'Something went wrong',
      });
      
      return { success: false, message: 'Verification failed' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const response = await authService.resendOTP(email);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: response.message,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to send OTP',
          text2: response.message,
        });
      }
      
      return { success: response.success, message: response.message };
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send OTP',
        text2: 'Something went wrong',
      });
      
      return { success: false, message: 'Failed to send OTP' };
    }
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    try {
      const response = await authService.forgotPassword(data);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Reset Code Sent',
          text2: response.message,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: response.message,
        });
      }
      
      return { success: response.success, message: response.message };
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: 'Something went wrong',
      });
      
      return { success: false, message: 'Failed to send reset code' };
    }
  };

  const resetPassword = async (data: ResetPasswordData) => {
    try {
      const response = await authService.resetPassword(data);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Password Reset',
          text2: response.message,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Reset Failed',
          text2: response.message,
        });
      }
      
      return { success: response.success, message: response.message };
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: 'Something went wrong',
      });
      
      return { success: false, message: 'Password reset failed' };
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
    try {
      const response = await authService.changePassword(data);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Password Changed',
          text2: response.message,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Change Failed',
          text2: response.message,
        });
      }
      
      return { success: response.success, message: response.message };
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Change Failed',
        text2: 'Something went wrong',
      });
      
      return { success: false, message: 'Password change failed' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storageService.clearAll();
      dispatch({ type: 'LOGOUT' });
      
      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'You have been logged out successfully',
      });
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await authService.deleteAccount();

      if (response.success) {
        await storageService.clearAll();
        dispatch({ type: 'LOGOUT' });

        Toast.show({
          type: 'success',
          text1: 'Account Deleted',
          text2: 'Your account has been permanently deleted',
        });

        return { success: true, message: response.message };
      } else {
        Toast.show({
          type: 'error',
          text1: 'Delete Failed',
          text2: response.message,
        });

        return { success: false, message: response.message };
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: 'Something went wrong',
      });

      return { success: false, message: 'Account deletion failed' };
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.user });
        await storageService.setUserData(response.data.user);
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  const needsPhoneNumber = () => {
    if (!state.user) return false;

    console.log(state.user, "State user");
    
    const phoneNumber = state.user.phoneNumber;

    if (!phoneNumber) return true;

    // Check based on the type of phoneNumber - use explicit type guards
    const phoneStr = phoneNumber as string | { internationalNumber?: string };

    if (typeof phoneStr === 'string') {
      return phoneStr.trim().length === 0;
    } else if (typeof phoneStr === 'object' && phoneStr !== null && 'internationalNumber' in phoneStr) {
      const internationalNumber = phoneStr.internationalNumber;
      return !internationalNumber || internationalNumber.length === 0;
    }

    return true;
  };

  const value: AuthContextType = {
    ...state,
    login,
    googleLogin,
    register,
    verifyEmail,
    resendOTP,
    forgotPassword,
    resetPassword,
    changePassword,
    deleteAccount,
    logout,
    refreshProfile,
    needsPhoneNumber,
    appleLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};