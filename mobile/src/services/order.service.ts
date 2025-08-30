import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { InitiatePurchaseRequest, PurchaseResponse } from '../types/order.types';
import { ApiResponse } from '../types/auth.types';

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  razorpayKey: string;
  userSubscriptionId: string;
  subscription?: any;
}

export interface PaymentVerificationRequest {
  userSubscriptionId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class OrderService {
  async initiatePurchase(orderData: InitiatePurchaseRequest): Promise<ApiResponse<RazorpayOrderResponse>> {
    console.log('Initiating purchase with data:', JSON.stringify(orderData, null, 2));
    console.log('🔗 API Endpoint being called:', API_ENDPOINTS.SUBSCRIPTION.PURCHASE);
    console.log('🌐 Full URL will be: baseURL + ', API_ENDPOINTS.SUBSCRIPTION.PURCHASE);
    
    const response = await apiService.post<RazorpayOrderResponse>(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/initiate`,
      orderData
    );
    
    console.log('📡 Raw API response:', response);
    return response;
  }

  async verifyPayment(data: PaymentVerificationRequest): Promise<ApiResponse<{ 
    success: boolean; 
    userSubscriptionId: string;
    userSubscription?: any;
  }>> {
    console.log('Verifying payment with data:', JSON.stringify(data, null, 2));
    console.log('🔗 Verification endpoint:', `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/verify-payment`);
    
    const response = await apiService.post<{ 
      success: boolean; 
      userSubscriptionId: string;
      userSubscription?: any;
    }>(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/verify-payment`,
      data
    );
    
    console.log('🔐 Payment verification response:', response);
    return response;
  }

  async getUserSubscriptions(): Promise<ApiResponse<{ subscriptions: any[] }>> {
    try {
      const response = await apiService.get<{ subscriptions: any[] }>(
        '/my-subscriptions'
      );
      
      if (!response.success && (response.message?.includes('not found') || response.message?.includes('No subscriptions'))) {
        return {
          success: true,
          message: 'No subscriptions yet',
          data: { subscriptions: [] }
        };
      }
      
      return response;
    } catch (error) {
      return {
        success: true,
        message: 'No subscriptions yet', 
        data: { subscriptions: [] }
      };
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    return await apiService.post<{ message: string }>(
      `/my-subscriptions/${subscriptionId}/cancel`,
      { reason }
    );
  }
}

export const orderService = new OrderService();