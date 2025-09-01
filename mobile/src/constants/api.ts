export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_OTP: '/auth/resend-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    DELETE_ACCOUNT: '/auth/delete-account',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    LOCATION: '/auth/location',
    GOOGLE: '/auth/google',
    FACEBOOK: '/auth/facebook',
  },
  USER: {
    PROFILE: '/user-profiles',
    ADDRESSES: '/user-profiles/addresses',
    PREFERENCES: '/user-profiles/preferences',
  },
  MENU: {
    GET_ALL: '/menus',
    GET_BY_ID: '/menus',
  },
  SUBSCRIPTION: {
    GET_ALL: '/subscriptions',
    GET_BY_ID: '/subscriptions',
    PURCHASE: '/subscription-purchase',
  },
  DELIVERY: {
    SAVE_INFO: '/delivery-info',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Please check your internet connection',
  SESSION_EXPIRED: 'Your session has expired. Please login again',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'An account with this email already exists',
  PHONE_EXISTS: 'This phone number is already registered',
  INVALID_OTP: 'Invalid verification code',
  OTP_EXPIRED: 'Verification code has expired',
  ACCOUNT_NOT_VERIFIED: 'Please verify your account first',
  GENERIC_ERROR: 'Something went wrong. Please try again',
} as const;