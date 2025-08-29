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
    return await apiService.post<RazorpayOrderResponse>(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/initiate`,
      orderData
    );
  }

  async verifyPayment(data: PaymentVerificationRequest): Promise<ApiResponse<{ 
    success: boolean; 
    userSubscriptionId: string;
    userSubscription?: any;
  }>> {
    console.log('Verifying payment with data:', JSON.stringify(data, null, 2));
    return await apiService.post<{ 
      success: boolean; 
      userSubscriptionId: string;
      userSubscription?: any;
    }>(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/verify-payment`,
      data
    );
  }

  async getUserSubscriptions(): Promise<ApiResponse<{ subscriptions: any[] }>> {
    return await apiService.get<{ subscriptions: any[] }>(
      '/my-subscriptions'
    );
  }
}

export const orderService = new OrderService();