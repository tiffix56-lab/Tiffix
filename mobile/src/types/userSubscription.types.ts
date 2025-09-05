export interface UserSubscription {
  _id: string;
  userId: string;
  subscriptionId: {
    _id: string;
    planName: string;
    duration: string;
    durationDays: number;
    originalPrice: number;
    discountedPrice: number;
    category: 'food_vendor' | 'home_chef';
    features: string[];
  };
  transactionId: {
    _id: string;
    amount: number;
    finalAmount: number;
    paymentId: string;
    completedAt: string;
    status: string;
  };
  creditsGranted: number;
  creditsUsed: number;
  skipCreditAvailable: number;
  skipCreditUsed: number;
  startDate: string;
  endDate: string;
  deliveryAddress: {
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
  promoCodeUsed?: {
    _id: string;
    code: string;
    discountType: string;
    discountValue: number;
  };
  status: 'pending' | 'active' | 'paused' | 'cancelled' | 'completed' | 'expired';
  vendorDetails: {
    isVendorAssigned: boolean;
    vendorSwitchUsed: boolean;
    currentVendor?: {
      vendorId: string;
      vendorType: string;
      assignedBy: string;
      assignedAt: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  // Enhanced fields from backend
  analytics?: {
    remainingDays: number;
    dailyMealCount: number;
    remainingCredits: number;
    creditsUsedPercentage: number;
    isActive: boolean;
    isExpired: boolean;
  };
  formattedDates?: {
    startDate: string;
    endDate: string;
    startDateTime: string;
    endDateTime: string;
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