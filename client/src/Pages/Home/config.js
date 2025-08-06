import { baseURL } from '@/services/config';
import { 
   
  Shield, 
  TrendingUp, 
  Users, 
  CreditCard, 
  BookOpen, 
  Globe,
  Server,
  Database
} from 'lucide-react';

// Main application configuration
export const appConfig = {
  company: {
    name: 'Tiffix by Futuredesks',
    fullName: 'Tiffix API Status',
    tagline: 'Healthy Meal just like Home',
    description: 'Comprehensive overview of our trading platform services and endpoints',
    uptimeTarget: '99.9%'
  },

  api: {
    baseURL: baseURL,
    healthCheckInterval: 30000, 
    version: 'v1'
  },

  // Theme Configuration
  theme: {
    primaryColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'black',
    cardBackground: 'gray-900/50',
    borderColor: 'gray-700/50'
  },

  services: [
    {
      id: 'public',
      name: 'Public Services',
      icon: Globe,
      color: 'from-green-400 to-green-600',
      healthEndpoint: '/health',
      description: 'Public endpoints and general system services',
      endpoints: [
        'GET /self - System self-check',
        'GET /health - Health status',
        'POST /upload-file - File upload service'
      ]
    },
    {
      id: 'auth',
      name: 'Authentication',
      icon: Shield,
      color: 'from-blue-400 to-blue-600',
      healthEndpoint: '/auth/self',
      description: 'User authentication and authorization services',
      endpoints: [
        'GET /auth/self - Auth service status',
        'POST /auth/login - User login',
        'POST /auth/register - User registration',
        'POST /auth/verify-email - Email verification',
        'POST /auth/resend-otp - Resend OTP',
        'POST /auth/logout - User logout',
        'POST /auth/change-password - Change password',
        'POST /auth/forgot-password - Forgot password',
        'POST /auth/reset-password - Reset password',
        'GET /auth/me - Get current user',
        'POST /auth/init-profile-fill - Update phone number',
        'GET /auth/google - Google OAuth',
        'GET /auth/google/callback - Google OAuth callback',
        'GET /auth/facebook - Facebook OAuth',
        'GET /auth/facebook/callback - Facebook OAuth callback',
        'GET /auth/failure - OAuth failure'
      ]
    },
    {
      id: 'user-profile',
      name: 'User Profiles',
      icon: Users,
      color: 'from-purple-400 to-purple-600',
      healthEndpoint: '/auth/self',
      description: 'User profile management and address handling',
      endpoints: [
        'GET /user-profiles - Get user profile',
        'PUT /user-profiles - Update user profile',
        'POST /user-profiles/addresses - Add address',
        'PUT /user-profiles/addresses/:addressIndex - Update address',
        'DELETE /user-profiles/addresses/:addressIndex - Delete address',
        'GET /user-profiles/addresses - Get all addresses',
        'PATCH /user-profiles/preferences - Update preferences'
      ]
    },
    {
      id: 'referral',
      name: 'Referral System',
      icon: TrendingUp,
      color: 'from-orange-400 to-orange-600',
      healthEndpoint: '/auth/self',
      description: 'Referral code validation and management',
      endpoints: [
        'GET /referral/validate/:referralCode - Validate referral code',
        'GET /referral/generate-link - Generate referral link',
        'GET /referral/stats - Get referral stats',
        'GET /admin/referral/analytics - Referral analytics (Admin)',
        'GET /admin/referral/leaderboard - Referral leaderboard (Admin)'
      ]
    },
    {
      id: 'menu',
      name: 'Menu Management',
      icon: BookOpen,
      color: 'from-red-400 to-red-600',
      healthEndpoint: '/auth/self',
      description: 'Food menu and item management services',
      endpoints: [
        'GET /menus - Get all menus',
        'GET /menus/:id - Get menu by ID',
        'POST /admin/menus - Create menu (Admin)',
        'PUT /admin/menus/:id - Update menu (Admin)',
        'DELETE /admin/menus/:id - Delete menu (Admin)',
        'PATCH /admin/menus/:id/toggle-availability - Toggle availability (Admin)',
        'PATCH /admin/menus/:id/rating - Update rating (Admin)',
        'PATCH /admin/menus/bulk-availability - Bulk update availability (Admin)'
      ]
    },
    {
      id: 'subscription',
      name: 'Subscriptions',
      icon: CreditCard,
      color: 'from-indigo-400 to-indigo-600',
      healthEndpoint: '/auth/self',
      description: 'Subscription plans and management',
      endpoints: [
        'GET /subscriptions - Get all subscriptions',
        'GET /subscriptions/:id - Get subscription by ID',
        'POST /admin/subscriptions - Create subscription (Admin)',
        'PUT /admin/subscriptions/:id - Update subscription (Admin)',
        'DELETE /admin/subscriptions/:id - Delete subscription (Admin)',
        'PATCH /admin/subscriptions/:id/toggle-status - Toggle status (Admin)'
      ]
    },
    {
      id: 'location-zone',
      name: 'Location Zones',
      icon: Database,
      color: 'from-teal-400 to-teal-600',
      healthEndpoint: '/auth/self',
      description: 'Service area and delivery zone management',
      endpoints: [
        'GET /zones - Get all location zones (Admin)',
        'GET /zones/:id - Get location zone by ID (Admin)',
        'GET /zones/check-service/:pincode - Check service availability (Admin)',
        'GET /zones/:zoneId/delivery-fee - Calculate delivery fee (Admin)',
        'POST /admin/zones - Create location zone (Admin)',
        'PUT /admin/zones/:id - Update location zone (Admin)',
        'DELETE /admin/zones/:id - Delete location zone (Admin)',
        'PATCH /admin/zones/:id/toggle-status - Toggle zone status (Admin)'
      ]
    },
    {
      id: 'vendor',
      name: 'Vendor Management',
      icon: Server,
      color: 'from-yellow-400 to-yellow-600',
      healthEndpoint: '/auth/self',
      description: 'Vendor profile and capacity management',
      endpoints: [
        'GET /vendors/me - Get vendor profile (Vendor)',
        'PUT /vendors/me/profile - Update vendor profile (Vendor)',
        'PATCH /vendors/:id/toggle-availability - Toggle availability',
        'PATCH /vendors/:id/capacity - Update capacity',
        'PATCH /vendors/:id/rating - Update rating',
        'GET /admin/vendors - Get all vendors (Admin)',
        'POST /admin/vendors - Create vendor with user (Admin)',
        'PUT /admin/vendors/:id - Update vendor profile (Admin)',
        'DELETE /admin/vendors/:id - Delete vendor profile (Admin)',
        'PATCH /admin/vendors/:id/verify - Verify vendor (Admin)',
        'PATCH /admin/vendors/:id/reset-capacity - Reset daily capacity (Admin)'
      ]
    }
  ],

  statusMessages: {
    checking: 'Checking system status...',
    allOperational: 'All systems operational',
    partialOutage: 'Some services experiencing issues',
    majorOutage: 'Multiple services down',
    unknown: 'System status unknown'
  },

  monitoring: {
    realTimeUpdates: 'Status refreshes every 30 seconds',
    serviceCoverage: 'Complete trading platform ecosystem'
  },
  healthDisplay: {
    showDetailedMetrics: true,
    showSystemInfo: true,
    showApplicationInfo: true,
    metricsToShow: {
      uptime: true,
      memoryUsage: true,
      cpuUsage: true,
      environment: true,
      responseTime: true
    }
  }
};

export const getTotalEndpoints = () => {
  return appConfig.services.reduce((total, service) => total + service.endpoints.length, 0);
};

export const buildApiUrl = (endpoint) => {
  return `${appConfig.api.baseURL}/${appConfig.api.version}${endpoint}`;
};