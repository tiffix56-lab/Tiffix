import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types/auth.types';

export interface Subscription {
  _id: string;
  planName: string;
  duration: 'weekly' | 'monthly' | 'yearly' | 'custom';
  planMenus: string[];
  durationDays: number;
  mealTimings: {
    isLunchAvailable: boolean;
    isDinnerAvailable: boolean;
    lunchOrderWindow: {
      startTime: string;
      endTime: string;
    };
    dinnerOrderWindow: {
      startTime: string;
      endTime: string;
    };
  };
  mealsPerPlan: number;
  userSkipMealPerPlan: number;
  originalPrice: number;
  discountedPrice: number;
  category: 'food_vendor' | 'home_chef';
  freeDelivery: boolean;
  description: string;
  features: string[];
  terms: string;
  isActive: boolean;
  currentPurchases: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionResponse {
  subscriptions: Subscription[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalSubscriptions: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TimeSlot {
  type: 'lunch' | 'dinner';
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

class SubscriptionService {
  async getActiveSubscriptions(params?: { page?: number; limit?: number; category?: string }): Promise<ApiResponse<SubscriptionResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.SUBSCRIPTION.GET_ALL}?${queryParams.toString()}`
      : API_ENDPOINTS.SUBSCRIPTION.GET_ALL;
      
    return await apiService.get<SubscriptionResponse>(url);
  }

  async getSubscriptionById(id: string): Promise<ApiResponse<{ subscription: Subscription }>> {
    return await apiService.get<{ subscription: Subscription }>(`${API_ENDPOINTS.SUBSCRIPTION.GET_ALL}/${id}`);
  }

  async getUserSubscriptions(params?: { 
    page?: number; 
    limit?: number; 
    status?: 'active' | 'paused' | 'cancelled' | 'expired';
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ subscriptions: any[]; pagination?: any }>> {
    console.log('🚀 [SUBSCRIPTION_SERVICE] Starting getUserSubscriptions with params:', params);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      
      const url = queryParams.toString() 
        ? `${API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS}?${queryParams.toString()}`
        : API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS;
        
      console.log('🔗 [SUBSCRIPTION_SERVICE] API URL constructed:', url);
      console.log('📋 [SUBSCRIPTION_SERVICE] API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS:', API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS);
      
      const response = await apiService.get<{ subscriptions: any[]; pagination?: any }>(url);
      
      console.log('📡 [SUBSCRIPTION_SERVICE] Raw API response received:');
      console.log('- Success:', response.success);
      console.log('- Message:', response.message);
      console.log('- Data:', response.data);
      console.log('- Error:', response.error);
      
      if (response.success && response.data) {
        console.log('✅ [SUBSCRIPTION_SERVICE] Successfully received subscription data');
        console.log('- Subscriptions count:', response.data.subscriptions?.length || 0);
        console.log('- First subscription (if exists):', response.data.subscriptions?.[0]);
        
        // Validate data structure
        if (!Array.isArray(response.data.subscriptions)) {
          console.log('⚠️ [SUBSCRIPTION_SERVICE] Invalid data structure - subscriptions is not an array');
          return {
            success: true,
            message: 'No subscriptions yet - invalid data structure',
            data: { subscriptions: [] }
          };
        }
        
        return response;
      }
      
      if (!response.success) {
        console.log('⚠️ [SUBSCRIPTION_SERVICE] API returned error:', response.message);
        
        // Handle specific error cases
        if (response.error?.code === 'UNAUTHORIZED' || response.error?.code === 'SESSION_EXPIRED') {
          console.log('🔐 [SUBSCRIPTION_SERVICE] Authentication error detected');
          return {
            success: false,
            message: 'Authentication failed. Please login again.',
            error: { code: 'AUTH_ERROR' },
            data: { subscriptions: [] }
          };
        }
        
        if (response.message?.includes('not found') || response.message?.includes('No subscriptions')) {
          console.log('🔄 [SUBSCRIPTION_SERVICE] Converting "not found" to empty success response');
          return {
            success: true,
            message: 'No subscriptions yet',
            data: { subscriptions: [] }
          };
        }
        
        if (response.error?.code === 'NETWORK_ERROR') {
          console.log('🌐 [SUBSCRIPTION_SERVICE] Network error detected');
          return {
            success: false,
            message: 'Network error. Please check your internet connection.',
            error: { code: 'NETWORK_ERROR' },
            data: { subscriptions: [] }
          };
        }
        
        console.log('❌ [SUBSCRIPTION_SERVICE] Returning error response as-is');
        return response;
      }
      
      console.log('⚠️ [SUBSCRIPTION_SERVICE] Unexpected response structure, returning empty subscriptions');
      return {
        success: true,
        message: 'No subscriptions yet - unexpected response',
        data: { subscriptions: [] }
      };
      
    } catch (error) {
      console.error('❌ [SUBSCRIPTION_SERVICE] Exception in getUserSubscriptions:', error);
      console.error('❌ [SUBSCRIPTION_SERVICE] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      
      return {
        success: true,
        message: 'No subscriptions yet - caught exception', 
        data: { subscriptions: [] }
      };
    }
  }

  async getActiveUserSubscriptions(): Promise<ApiResponse<{ subscriptions: any[] }>> {
    return this.getUserSubscriptions({ status: 'active', limit: 50 });
  }

  async getUserSubscriptionById(subscriptionId: string): Promise<ApiResponse<{ subscription: any }>> {
    return await apiService.get<{ subscription: any }>(`${API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS}/${subscriptionId}`);
  }

  async cancelUserSubscription(subscriptionId: string, cancellationReason: string): Promise<ApiResponse<{ message: string }>> {
    console.log('🚀 [SUBSCRIPTION_SERVICE] Starting cancelUserSubscription:', { subscriptionId, cancellationReason });
    
    const response = await apiService.post<{ message: string }>(
      `${API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS}/${subscriptionId}/cancel`,
      { cancellationReason }
    );
    
    console.log('📡 [SUBSCRIPTION_SERVICE] Cancel subscription response:', response);
    return response;
  }

  async requestVendorSwitch(subscriptionId: string, reason: string, preferredVendorId?: string): Promise<ApiResponse<{ message: string }>> {
    console.log('🚀 [SUBSCRIPTION_SERVICE] Starting requestVendorSwitch:', { subscriptionId, reason, preferredVendorId });
    
    const response = await apiService.post<{ message: string }>(
      `${API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS}/${subscriptionId}/request-vendor-switch`,
      { reason, preferredVendorId }
    );
    
    console.log('📡 [SUBSCRIPTION_SERVICE] Vendor switch response:', response);
    return response;
  }


  // Generate available time slots based on subscription meal timings
  generateTimeSlots(subscription: Subscription): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    if (subscription.mealTimings.isLunchAvailable) {
      slots.push({
        type: 'lunch',
        label: 'Lunch Delivery',
        startTime: subscription.mealTimings.lunchOrderWindow.startTime,
        endTime: subscription.mealTimings.lunchOrderWindow.endTime,
        available: true
      });
    }
    
    if (subscription.mealTimings.isDinnerAvailable) {
      slots.push({
        type: 'dinner',
        label: 'Dinner Delivery',
        startTime: subscription.mealTimings.dinnerOrderWindow.startTime,
        endTime: subscription.mealTimings.dinnerOrderWindow.endTime,
        available: true
      });
    }
    
    return slots;
  }

  // Format time for display
  formatTime(time: string): string {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  }
}

// Update API endpoints
export const SUBSCRIPTION_ENDPOINTS = {
  GET_ALL: '/subscriptions',
  GET_BY_ID: '/subscriptions'
} as const;

export const subscriptionService = new SubscriptionService();