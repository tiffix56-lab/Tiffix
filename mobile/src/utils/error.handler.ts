import { AxiosError } from 'axios';
import { ApiResponse } from '../types/auth.types';
import { ERROR_MESSAGES, HTTP_STATUS } from '../constants/api';

class ErrorHandler {
  handleApiError(error: any): ApiResponse {
    if (error instanceof AxiosError) {
      if (!error.response) {
        return {
          success: false,
          message: ERROR_MESSAGES.NETWORK_ERROR,
          error: { code: 'NETWORK_ERROR' },
        };
      }

      const { status, data } = error.response;
      
      switch (status) {
        case HTTP_STATUS.BAD_REQUEST:
          return {
            success: false,
            message: data?.message || 'Invalid request',
            error: { code: 'BAD_REQUEST', details: data },
          };
          
        case HTTP_STATUS.UNAUTHORIZED:
          return {
            success: false,
            message: ERROR_MESSAGES.SESSION_EXPIRED,
            error: { code: 'UNAUTHORIZED' },
          };
          
        case HTTP_STATUS.FORBIDDEN:
          return {
            success: false,
            message: data?.message || 'Access denied',
            error: { code: 'FORBIDDEN' },
          };
          
        case HTTP_STATUS.NOT_FOUND:
          return {
            success: false,
            message: data?.message || 'Resource not found',
            error: { code: 'NOT_FOUND' },
          };
          
        case HTTP_STATUS.CONFLICT:
          return {
            success: false,
            message: data?.message || ERROR_MESSAGES.EMAIL_EXISTS,
            error: { code: 'CONFLICT', details: data },
          };
          
        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          return {
            success: false,
            message: this.extractValidationError(data) || 'Validation error',
            error: { code: 'VALIDATION_ERROR', details: data },
          };
          
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          return {
            success: false,
            message: ERROR_MESSAGES.GENERIC_ERROR,
            error: { code: 'SERVER_ERROR' },
          };
          
        default:
          return {
            success: false,
            message: data?.message || ERROR_MESSAGES.GENERIC_ERROR,
            error: { code: 'UNKNOWN_ERROR', details: data },
          };
      }
    }
    
    if (error.message === 'Session expired') {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED,
        error: { code: 'SESSION_EXPIRED' },
      };
    }

    return {
      success: false,
      message: error.message || ERROR_MESSAGES.GENERIC_ERROR,
      error: { code: 'UNKNOWN_ERROR' },
    };
  }

  private extractValidationError(data: any): string | null {
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors[0]?.message || null;
    }
    
    if (data?.error && typeof data.error === 'string') {
      return data.error;
    }
    
    if (data?.message) {
      return data.message;
    }
    
    return null;
  }

  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'INVALID_CREDENTIALS':
        return ERROR_MESSAGES.INVALID_CREDENTIALS;
      case 'EMAIL_EXISTS':
        return ERROR_MESSAGES.EMAIL_EXISTS;
      case 'PHONE_EXISTS':
        return ERROR_MESSAGES.PHONE_EXISTS;
      case 'INVALID_OTP':
        return ERROR_MESSAGES.INVALID_OTP;
      case 'OTP_EXPIRED':
        return ERROR_MESSAGES.OTP_EXPIRED;
      case 'ACCOUNT_NOT_VERIFIED':
        return ERROR_MESSAGES.ACCOUNT_NOT_VERIFIED;
      case 'NETWORK_ERROR':
        return ERROR_MESSAGES.NETWORK_ERROR;
      case 'SESSION_EXPIRED':
        return ERROR_MESSAGES.SESSION_EXPIRED;
      default:
        return ERROR_MESSAGES.GENERIC_ERROR;
    }
  }

  isNetworkError(error: any): boolean {
    return error instanceof AxiosError && !error.response;
  }

  isAuthError(error: any): boolean {
    if (error instanceof AxiosError) {
      return error.response?.status === HTTP_STATUS.UNAUTHORIZED;
    }
    return error.message === 'Session expired';
  }

  isValidationError(error: any): boolean {
    if (error instanceof AxiosError) {
      return error.response?.status === HTTP_STATUS.UNPROCESSABLE_ENTITY;
    }
    return false;
  }
}

export { ErrorHandler };
export const errorHandler = new ErrorHandler();