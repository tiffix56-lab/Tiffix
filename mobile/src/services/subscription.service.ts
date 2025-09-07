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
        
      console.log('🔗 Fetching user subscriptions from:', url);
      
      const response = await apiService.get<{ subscriptions: any[]; pagination?: any }>(url);
      
      console.log('📡 User subscriptions response:', response);
      
      if (!response.success && (response.message?.includes('not found') || response.message?.includes('No subscriptions'))) {
        return {
          success: true,
          message: 'No subscriptions yet',
          data: { subscriptions: [] }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching user subscriptions:', error);
      return {
        success: true,
        message: 'No subscriptions yet', 
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
    return await apiService.post<{ message: string }>(
      `${API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS}/${subscriptionId}/cancel`,
      { cancellationReason }
    );
  }

  async requestVendorSwitch(subscriptionId: string, reason: string, preferredVendorId?: string): Promise<ApiResponse<{ message: string }>> {
    return await apiService.post<{ message: string }>(
      `${API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS}/${subscriptionId}/request-vendor-switch`,
      { reason, preferredVendorId }
    );
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    return await apiService.post<{ message: string }>(
      `${API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS}/${subscriptionId}/cancel`,
      { reason }
    );
  }

  async requestVendorSwitch(subscriptionId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    return await apiService.post<{ message: string }>(
      `${API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS}/${subscriptionId}/request-vendor-switch`,
      { reason }
    );
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