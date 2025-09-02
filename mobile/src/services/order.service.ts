import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { InitiatePurchaseRequest, PurchaseResponse } from '../types/order.types';
import { ApiResponse } from '../types/auth.types';

export interface PhonePeOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  phonepeKey: string;
  paymentUrl: string;
  userSubscriptionId: string;
  subscription?: any;
}

export interface PaymentVerificationRequest {
  userSubscriptionId: string;
  phonepe_transaction_id: string;
  phonepe_merchant_id: string;
  phonepe_checksum: string;
}

class OrderService {
  async initiatePurchase(orderData: InitiatePurchaseRequest): Promise<ApiResponse<PhonePeOrderResponse>> {
    console.log('Initiating purchase with data:', JSON.stringify(orderData, null, 2));
    console.log('🔗 API Endpoint being called:', API_ENDPOINTS.SUBSCRIPTION.PURCHASE);
    console.log('🌐 Full URL will be: baseURL + ', API_ENDPOINTS.SUBSCRIPTION.PURCHASE);
    
    const response = await apiService.post<PhonePeOrderResponse>(
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

  async getMyOrders(): Promise<ApiResponse<{ orders: any[] }>> {
    try {
      const response = await apiService.get<{ orders: any[] }>(
        API_ENDPOINTS.ORDERS.MY_ORDERS
      );
      
      if (!response.success && response.message?.includes('not found')) {
        return {
          success: true,
          message: 'No orders found',
          data: { orders: [] }
        };
      }
      
      return response;
    } catch (error) {
      return {
        success: true,
        message: 'No orders found', 
        data: { orders: [] }
      };
    }
  }

  async getOrderById(orderId: string): Promise<ApiResponse<{ order: any }>> {
    return await apiService.get<{ order: any }>(`${API_ENDPOINTS.ORDERS.GET_BY_ID}/${orderId}`);
  }

  async skipOrder(orderId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    return await apiService.post<{ message: string }>(
      `${API_ENDPOINTS.ORDERS.SKIP}/${orderId}/skip`,
      { reason }
    );
  }

  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    return await apiService.post<{ message: string }>(
      `${API_ENDPOINTS.ORDERS.CANCEL}/${orderId}/cancel`,
      { reason }
    );
  }
}

export const orderService = new OrderService();