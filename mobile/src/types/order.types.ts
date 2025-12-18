import { Address } from './address.types';
import { MenuItem } from './menu.types';
import { Subscription } from '../services/subscription.service';

export interface OrderData {
  selectedMenu: MenuItem;
  selectedSubscription: Subscription;
  deliveryAddress: Address;
  deliveryDate: string;
  subscriptionId: string;
  lunchEnabled: boolean;
  lunchTime: string;
  referralCode?: string;
  dinnerEnabled: boolean;
  dinnerTime: string;
  promoCode?: string;
  orderId?: string;
  userSubscriptionId?: string;
  paymentAmount?: number;
}

export interface RazorpayPurchaseResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    razorpayOrderId: string;
    razorpayKeyId: string;
    amount: number;
    baseAmount: number;
    gstAmount: number;
    currency: string;
    userSubscriptionId: string;
    subscription: {
      planName: string;
      duration: string;
      durationDays: number;
      startDate: string;
      endDate: string;
      timezone: string;
    };
    priceBreakdown: {
      basePrice: number;
      gstRate: string;
      gstAmount: number;
      totalAmount: number;
    };
  };
}

export interface RazorpayVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userSubscriptionId: string;
}

export interface RazorpayVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    subscriptionId: string;
    status: string;
    subscription: {
      startDate: string;
      endDate: string;
      startDateTime: string;
      endDateTime: string;
      creditsGranted: number;
      skipCreditAvailable: number;
      timezone: string;
    };
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  message: string;
  data?: {
    status: 'success' | 'failed' | 'pending';
    paymentStatus: 'completed' | 'failed' | 'pending';
    subscription?: {
      id: string;
      status: string;
      planName: string;
      startDate: string;
      endDate: string;
    };
  };
}