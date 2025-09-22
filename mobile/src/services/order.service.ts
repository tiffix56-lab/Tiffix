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
}

export const orderService = new OrderService();