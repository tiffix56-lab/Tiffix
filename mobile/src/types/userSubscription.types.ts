export interface UserSubscription {
  _id: string;
  userId: string;
  subscriptionId: string;
  transactionId: string;
  creditsGranted: number;
  creditsUsed: number;
  skipCreditAvailable: number;
  skipCreditUsed: number;
  startDate: string;
  endDate: string;
  deliveryAddress: {
    label: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  mealTiming: {
    lunch: {
      enabled: boolean;
      time: string;
    };
    dinner: {
      enabled: boolean;
      time: string;
    };
  };
  originalPrice: number;
  finalPrice: number;
  discountApplied: number;
  promoCodeUsed?: string;
  status: 'pending' | 'active' | 'paused' | 'cancelled' | 'completed' | 'expired';
  autoRenewal: boolean;
  vendorAssigned?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    planName: string;
    duration: string;
    durationDays: number;
    mealsPerPlan: number;
    userSkipMealPerPlan: number;
    category: 'vendor' | 'home_chef';
    features: string[];
  };
}

export interface UserSubscriptionResponse {
  subscriptions: UserSubscription[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}