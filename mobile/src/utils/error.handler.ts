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
            message: this.extractErrorMessage(data) || 'The request contains invalid information. Please check your input and try again.',
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
            message: this.extractErrorMessage(data) || 'You don\'t have permission to access this resource.',
            error: { code: 'FORBIDDEN' },
          };
          
        case HTTP_STATUS.NOT_FOUND:
          return {
            success: false,
            message: this.extractErrorMessage(data) || 'The requested resource was not found.',
            error: { code: 'NOT_FOUND' },
          };
          
        case HTTP_STATUS.CONFLICT:
          return {
            success: false,
            message: this.extractErrorMessage(data) || ERROR_MESSAGES.EMAIL_EXISTS,
            error: { code: 'CONFLICT', details: data },
          };
          
        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          return {
            success: false,
            message: this.extractValidationError(data) || 'Please check your input data and try again.',
            error: { code: 'VALIDATION_ERROR', details: data },
          };
          
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          return {
            success: false,
            message: this.extractErrorMessage(data) || 'Our servers are experiencing issues. Please try again later.',
            error: { code: 'SERVER_ERROR' },
          };
          
        default:
          return {
            success: false,
            message: this.extractErrorMessage(data) || 'Something went wrong. Please try again.',
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

  private extractErrorMessage(data: any): string | null {
    // Try to extract meaningful error messages from various response formats
    if (!data) return null;

    // Direct message from server
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }

    // Error field as string
    if (data.error && typeof data.error === 'string') {
      return data.error;
    }

    // Error object with message
    if (data.error && typeof data.error === 'object' && data.error.message) {
      return data.error.message;
    }

    // Validation errors array
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      if (typeof firstError === 'string') return firstError;
      if (firstError.message) return firstError.message;
      if (firstError.msg) return firstError.msg;
    }

    // Details field
    if (data.details && typeof data.details === 'string') {
      return data.details;
    }

    // Common API error formats
    if (data.data && data.data.message) {
      return data.data.message;
    }

    return null;
  }

  private extractValidationError(data: any): string | null {
    // First try the general extraction method
    const generalError = this.extractErrorMessage(data);
    if (generalError) return generalError;

    // Additional validation-specific formats
    if (data?.errors && Array.isArray(data.errors)) {
      const validationErrors = data.errors.map((error: any) => {
        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        if (error.msg) return error.msg;
        if (error.field && error.message) return `${error.field}: ${error.message}`;
        return null;
      }).filter(Boolean);

      if (validationErrors.length > 0) {
        return validationErrors.join(', ');
      }
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