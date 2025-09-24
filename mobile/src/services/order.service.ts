import { ApiResponse } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import api from '../lib/axios';
import { 
  RazorpayPurchaseResponse, 
  RazorpayVerificationRequest, 
  RazorpayVerificationResponse,
  PaymentStatusResponse 
} from '../types/order.types';
import { SubscriptionPurchaseData } from '../context/PaymentContext';

class OrderService {
  async initiateRazorpayPurchase(orderData: SubscriptionPurchaseData): Promise<ApiResponse<RazorpayPurchaseResponse['data']>> {
    console.log('🚀 Initiating Razorpay purchase with data:', JSON.stringify(orderData, null, 2));
    console.log('🔗 API Endpoint:', `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/initiate`);
    
    const response = await api.post<RazorpayPurchaseResponse['data']>(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/initiate`,
      orderData
    );
    
    console.log('📡 Razorpay purchase response:', response);
    return response;
  }

  async verifyRazorpayPayment(data: RazorpayVerificationRequest): Promise<ApiResponse<RazorpayVerificationResponse['data']>> {
    console.log('🔍 Verifying Razorpay payment:', {
      razorpay_order_id: data.razorpay_order_id,
      razorpay_payment_id: data.razorpay_payment_id,
      userSubscriptionId: data.userSubscriptionId
    });

    const response = await api.post<RazorpayVerificationResponse['data']>(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/verify-payment`,
      data
    );
    
    console.log('✅ Payment verification response:', response);
    return response;
  }

  async checkPaymentStatus(orderId: string): Promise<ApiResponse<PaymentStatusResponse['data']>> {
    console.log('📊 Checking payment status for orderId:', orderId);

    const response = await api.get<PaymentStatusResponse['data']>(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/check-payment-status/${orderId}`
    );
    
    console.log('📈 Payment status response:', response);
    return response;
  }

  async getSubscriptionStatus(userSubscriptionId: string): Promise<ApiResponse<any>> {
    console.log('🔍 Getting subscription status for userSubscriptionId:', userSubscriptionId);

    const response = await api.get(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/subscription-status/${userSubscriptionId}`
    );
    
    console.log('📊 Subscription status response:', response);
    return response;
  }

  // Get user orders (based on order.http)
  async getUserOrders(params?: {
    page?: number;
    limit?: number;
    status?: string; // 'upcoming', 'delivered', etc.
    search?: string;
    startDate?: string;
    endDate?: string;
    days?: number; // Get orders for next N days
  }): Promise<ApiResponse<{ orders: any[]; pagination?: any }>> {
    console.log('🚀 [ORDER_SERVICE] Getting user orders with params:', params);

    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.days) queryParams.append('days', params.days.toString());
      
      const url = queryParams.toString() 
        ? `${API_ENDPOINTS.ORDERS.MY_ORDERS}?${queryParams.toString()}`
        : API_ENDPOINTS.ORDERS.MY_ORDERS;
        
      console.log('🔗 [ORDER_SERVICE] API URL constructed:', url);
      
      const response = await api.get<{ orders: any[]; pagination?: any }>(url);
      
      console.log('📡 [ORDER_SERVICE] Orders response:', response);
      return response;
    } catch (error) {
      console.error('❌ [ORDER_SERVICE] Error getting user orders:', error);
      throw error;
    }
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<ApiResponse<{ order: any }>> {
    console.log('🔍 [ORDER_SERVICE] Getting order by ID:', orderId);

    try {
      const response = await api.get<{ order: any }>(`${API_ENDPOINTS.ORDERS.GET_BY_ID}/${orderId}`);
      
      console.log('📡 [ORDER_SERVICE] Order response:', response);
      return response;
    } catch (error) {
      console.error('❌ [ORDER_SERVICE] Error getting order:', error);
      throw error;
    }
  }

  // Skip order (based on order.http)
  async skipOrder(orderId: string, skipReason?: string): Promise<ApiResponse<{ message: string }>> {
    console.log('⏭️ [ORDER_SERVICE] Skipping order:', orderId, 'skipReason:', skipReason);

    try {
      const response = await api.post<{ message: string }>(
        `${API_ENDPOINTS.ORDERS.SKIP}/${orderId}/skip`,
        { skipReason }
      );
      
      console.log('📡 [ORDER_SERVICE] Skip order response:', response);
      return response;
    } catch (error) {
      console.error('❌ [ORDER_SERVICE] Error skipping order:', error);
      throw error;
    }
  }

  // Cancel order (based on order.http)
  async cancelOrder(orderId: string, cancelReason?: string): Promise<ApiResponse<{ message: string }>> {
    console.log('❌ [ORDER_SERVICE] Cancelling order:', orderId, 'cancelReason:', cancelReason);

    try {
      const response = await api.post<{ message: string }>(
        `${API_ENDPOINTS.ORDERS.CANCEL}/${orderId}/cancel`,
        { cancelReason }
      );
      
      console.log('📡 [ORDER_SERVICE] Cancel order response:', response);
      return response;
    } catch (error) {
      console.error('❌ [ORDER_SERVICE] Error cancelling order:', error);
      throw error;
    }
  }

  // Convenience methods for common use cases

  // Get upcoming orders (common filter)
  async getUpcomingOrders(params?: { page?: number; limit?: number }): Promise<ApiResponse<{ orders: any[]; pagination?: any }>> {
    return this.getUserOrders({ ...params, status: 'upcoming' });
  }

  // Get delivered orders (common filter)
  async getDeliveredOrders(params?: { page?: number; limit?: number }): Promise<ApiResponse<{ orders: any[]; pagination?: any }>> {
    return this.getUserOrders({ ...params, status: 'delivered' });
  }

  // Get next 7 days orders (common filter)
  async getNext7DaysOrders(): Promise<ApiResponse<{ orders: any[]; pagination?: any }>> {
    return this.getUserOrders({ days: 7 });
  }

  // Search orders by text
  async searchOrders(searchText: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<{ orders: any[]; pagination?: any }>> {
    return this.getUserOrders({ ...params, search: searchText });
  }
}

export const orderService = new OrderService();