import { ApiResponse, apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { 
  RazorpayPurchaseResponse, 
  RazorpayVerificationRequest, 
  RazorpayVerificationResponse,
  PaymentStatusResponse 
} from '../types/order.types';
import { SubscriptionPurchaseData } from '../context/PaymentContext';

interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  userSubscriptionId?: {
    _id: string;
    subscriptionId?: {
      _id: string;
      planName: string;
      category: string;
    };
    mealTiming: any;
    skipCreditAvailable: number;
  };
  selectedMenus?: Array<{
    _id: string;
    foodTitle: string;
    foodImage?: string;
    price: number;
  }>;
  vendorDetails?: {
    vendorId: {
      _id: string;
      businessInfo?: {
        businessName: string;
      };
    };
  };
  deliveryDate: string;
  deliveryTime: string;
  mealType: 'lunch' | 'dinner';
  status: 'upcoming' | 'preparing' | 'out_for_delivery' | 'delivered' | 'skipped' | 'cancelled';
  specialInstructions?: string;
  skipDetails?: {
    skipReason?: string;
    isSkipped?: boolean;
  };
  cancellationDetails?: {
    cancelReason?: string;
    isCancelled?: boolean;
  };
  deliveryConfirmation?: {
    deliveryNotes?: string;
    deliveredAt?: string;
    deliveryPhotos?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface GetOrdersParams {
  page?: number;
  limit?: number; // max 100 as per backend validation
  status?: 'upcoming' | 'preparing' | 'out_for_delivery' | 'delivered' | 'skipped' | 'cancelled';
  search?: string; // min 1, max 100 chars
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  days?: number; // max 30 as per backend validation
  vendorId?: string; // MongoDB ObjectId for admin queries
}

interface OrdersResponse {
  orders: Order[];
  pagination?: {
    current: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class OrderService {
  async initiateRazorpayPurchase(orderData: SubscriptionPurchaseData): Promise<ApiResponse<RazorpayPurchaseResponse['data']>> {
    return await apiService.post<RazorpayPurchaseResponse['data']>(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/initiate`,
      orderData
    );
  }

  async verifyRazorpayPayment(data: RazorpayVerificationRequest): Promise<ApiResponse<RazorpayVerificationResponse['data']>> {
    return await apiService.post<RazorpayVerificationResponse['data']>(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/verify-payment`,
      data
    );
  }

  async checkPaymentStatus(orderId: string): Promise<ApiResponse<PaymentStatusResponse['data']>> {
    return await apiService.get<PaymentStatusResponse['data']>(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/check-payment-status/${orderId}`
    );
  }

  async getSubscriptionStatus(userSubscriptionId: string): Promise<ApiResponse<any>> {
    return await apiService.get(
      `${API_ENDPOINTS.SUBSCRIPTION.PURCHASE}/subscription-status/${userSubscriptionId}`
    );
  }

  async getUserOrders(params?: GetOrdersParams): Promise<ApiResponse<OrdersResponse>> {
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
      
      const response = await apiService.get<any>(url);
      
      if (response.success && response.data) {
        // Backend returns: { orders: [...], pagination: {...}, filters: {...} }
        return {
          ...response,
          data: {
            orders: response.data.orders || [],
            pagination: response.data.pagination || null
          }
        };
      }
      
      return {
        success: false,
        message: response.message || 'No orders found',
        data: { orders: [] }
      };
      
    } catch (error) {
      console.error('Error getting user orders:', error);
      
      return {
        success: false,
        message: 'Failed to fetch orders',
        error: { code: 'FETCH_ERROR' },
        data: { orders: [] }
      };
    }
  }

  async getOrderById(orderId: string): Promise<ApiResponse<{ order: Order }>> {
    try {
      const response = await apiService.get<{ order: Order }>(`${API_ENDPOINTS.ORDERS.GET_BY_ID}/${orderId}`);
      return response;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  async skipOrder(orderId: string, skipReason?: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiService.post<{ message: string }>(
        `/orders/${orderId}/skip`,
        { skipReason: skipReason || 'User requested skip' }
      );
      
      if (response.success) {
        return response;
      } else {
        return {
          success: false,
          message: response.message || 'Failed to skip order',
          error: { code: 'SKIP_ERROR' }
        };
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('422')) {
        return {
          success: false,
          message: 'Cannot skip this order. It may be too close to delivery time.',
          error: { code: 'VALIDATION_ERROR' }
        };
      }
      
      if (error instanceof Error && error.message.includes('404')) {
        return {
          success: false,
          message: 'Order not found or already processed.',
          error: { code: 'NOT_FOUND' }
        };
      }
      
      return {
        success: false,
        message: 'Failed to skip order. Please try again.',
        error: { code: 'UNKNOWN_ERROR' }
      };
    }
  }

  async cancelOrder(orderId: string, cancelReason?: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiService.post<{ message: string }>(
        `/orders/${orderId}/cancel`,
        { cancelReason: cancelReason || 'User requested cancellation' }
      );
      
      if (response.success) {
        return response;
      } else {
        return {
          success: false,
          message: response.message || 'Failed to cancel order',
          error: { code: 'CANCEL_ERROR' }
        };
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('422')) {
        return {
          success: false,
          message: 'Cannot cancel this order. It may be too close to delivery time or already processed.',
          error: { code: 'VALIDATION_ERROR' }
        };
      }
      
      if (error instanceof Error && error.message.includes('404')) {
        return {
          success: false,
          message: 'Order not found or already processed.',
          error: { code: 'NOT_FOUND' }
        };
      }
      
      return {
        success: false,
        message: 'Failed to cancel order. Please try again.',
        error: { code: 'UNKNOWN_ERROR' }
      };
    }
  }

  async getUpcomingOrders(params?: { page?: number; limit?: number }): Promise<ApiResponse<OrdersResponse>> {
    return this.getUserOrders({ ...params, status: 'upcoming' });
  }

  async getDeliveredOrders(params?: { page?: number; limit?: number }): Promise<ApiResponse<OrdersResponse>> {
    return this.getUserOrders({ ...params, status: 'delivered' });
  }

  async getNext7DaysOrders(): Promise<ApiResponse<OrdersResponse>> {
    return this.getUserOrders({ days: 7 });
  }

  async searchOrders(searchText: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<OrdersResponse>> {
    return this.getUserOrders({ ...params, search: searchText });
  }
}

export const orderService = new OrderService();