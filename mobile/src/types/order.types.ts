import { Address } from './address.types';
import { MenuItem } from './menu.types';
import { Subscription } from '../services/subscription.service';

export interface OrderData {
  selectedMenu: MenuItem;
  selectedSubscription: Subscription;
  deliveryAddress: Address;
  deliveryDate: string;
  mealTimings: {
    lunch: {
      enabled: boolean;
      time?: string;
    };
    dinner: {
      enabled: boolean;
      time?: string;
    };
  };
}

export interface InitiatePurchaseRequest {
  subscriptionId: string;
  promoCode?: string;
  deliveryAddress: {
    label: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  mealTimings: {
    lunch: {
      enabled: boolean;
      time?: string;
    };
    dinner: {
      enabled: boolean;
      time?: string;
    };
  };
  startDate: string;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    paymentUrl: string;
    amount: number;
    currency: string;
    phonepeKey: string;
    userSubscriptionId: string;
    subscription: any;
  };
}