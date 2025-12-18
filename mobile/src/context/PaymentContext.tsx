import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { STORAGE_KEYS } from '../constants/storage';
import { API_BASE_URL } from '../constants/config';
import api from '../lib/axios';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface RazorpayOptions {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  name: string;
  image: string;
  orderId: string;
  userSubscriptionId: string;
}

export interface PaymentResponse {
  success: boolean;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  error?: string;
  message?: string;
}

export interface SubscriptionPurchaseData {
  subscriptionId: string;
  referralCode?: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates: {
      type: "Point";
      coordinates: [number, number];
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

interface PaymentContextType {
  isLoading: boolean;
  paymentStatus: PaymentStatus;
  showPaymentWebView: boolean;
  razorpayOptions: RazorpayOptions | null;
  initiateSubscriptionPurchase: (data: SubscriptionPurchaseData) => Promise<{ orderId: string; userSubscriptionId: string; requiresPayment: boolean }>;
  initiateRazorpayPayment: (options: RazorpayOptions) => void;
  handlePaymentResponse: (response: PaymentResponse) => Promise<void>;
  verifySubscriptionPayment: (paymentData: PaymentResponse, userSubscriptionId: string) => Promise<void>;
  closePaymentWebView: () => void;
  generateRazorpayHTML: (options: RazorpayOptions) => string;
  handlePaymentError: (error: any, context: string) => void;
}

const PaymentContext = createContext<PaymentContextType>({
  isLoading: false,
  paymentStatus: 'PENDING',
  showPaymentWebView: false,
  razorpayOptions: null,
  initiateSubscriptionPurchase: async () => ({ orderId: '', userSubscriptionId: '', requiresPayment: false }),
  initiateRazorpayPayment: () => { },
  handlePaymentResponse: async () => { },
  verifySubscriptionPayment: async () => { },
  closePaymentWebView: () => { },
  generateRazorpayHTML: () => '',
  handlePaymentError: () => { },
});

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [razorpayOptions, setRazorpayOptions] = useState<RazorpayOptions | null>(null);

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const handleAuthError = () => {
    Alert.alert('Session Expired', 'Please login again');
    AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  };

  const handlePaymentError = (error: any, context: string) => {
    console.error(`${context} error:`, error);

    if (error.response?.status === 401) {
      handleAuthError();
      return;
    }

    const errorMessage = error.response?.data?.message || error.message || `${context} failed`;
    Alert.alert('Error', errorMessage);
    setPaymentStatus('FAILED');
    setIsLoading(false);
  };

  const initiateSubscriptionPurchase = async (data: SubscriptionPurchaseData): Promise<{ orderId: string; userSubscriptionId: string; requiresPayment: boolean }> => {
    try {
      setIsLoading(true);
      setPaymentStatus('PENDING');
      console.log("Data init", data);
      
      const response = await api.post('/subscription-purchase/initiate', data);

      if (response.data?.success && response.data?.data) {
        const responseData = response.data.data;
        console.log("Heree");
        
        const options: RazorpayOptions = {
          razorpayOrderId: responseData.razorpayOrderId,
          amount: responseData.amount,
          name: 'Tiffix',
          image: '/assets/logo-main.png',
          currency: responseData.currency || 'INR',
          razorpayKeyId: responseData.razorpayKeyId,
          orderId: responseData.orderId,
          userSubscriptionId: responseData.userSubscriptionId
        };

        initiateRazorpayPayment(options);
        return { 
          orderId: responseData.orderId, 
          userSubscriptionId: responseData.userSubscriptionId, 
          requiresPayment: true 
        };
      } else {
        throw new Error(response.data?.message || 'Failed to create payment order');
      }
    } catch (error: any) {
      handlePaymentError(error, 'Subscription Purchase');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const initiateRazorpayPayment = (options: RazorpayOptions): void => {
    setRazorpayOptions(options);
    setShowPaymentWebView(true);
    setPaymentStatus('PENDING');
  };

  const generateRazorpayHTML = (options: RazorpayOptions): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Gateway</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta charset="UTF-8">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
          }
          .loading {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .message {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 10px;
          }
          .sub-message {
            font-size: 14px;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div class="loading">
          <div class="spinner"></div>
          <div class="message">Opening Payment Gateway...</div>
          <div class="sub-message">Please wait while we load Razorpay</div>
        </div>
        
        <script>
          const options = {
            key: '${options.razorpayKeyId}',
            amount: ${options.amount},
            currency: '${options.currency}',
            name: '${options.name}',
            image: 'https://app.tiffix.com/logo-main.png',
            description: 'Subscription Purchase',
            order_id: '${options.razorpayOrderId}',
            theme: {
              color: '#22c55e'
            },
            handler: function(response) {
              const successData = {
                success: true,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              };
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(successData));
              }
            },
            modal: {
              ondismiss: function() {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    success: false,
                    error: 'PAYMENT_CANCELLED'
                  }));
                }
              }
            }
          };

          setTimeout(() => {
            try {
              if (typeof Razorpay === 'undefined') {
                throw new Error('Razorpay SDK not loaded');
              }
              
              const rzp = new Razorpay(options);
              rzp.open();
            } catch (error) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  success: false,
                  error: 'RAZORPAY_INIT_ERROR',
                  message: error.message
                }));
              }
            }
          }, 1500);
        </script>
      </body>
      </html>
    `;
  };

  const handlePaymentResponse = async (response: PaymentResponse): Promise<void> => {
    try {
      setShowPaymentWebView(false);
      setRazorpayOptions(null);

      if (response.success) {
        setPaymentStatus('SUCCESS');
      } else {
        setPaymentStatus(response.error === 'PAYMENT_CANCELLED' ? 'CANCELLED' : 'FAILED');

        if (response.error !== 'PAYMENT_CANCELLED') {
          Alert.alert(
            'Payment Failed',
            response.message || 'Payment could not be processed. Please try again.'
          );
        }
      }
    } catch (error) {
      handlePaymentError(error, 'Payment Response Handling');
    }
  };

  const verifySubscriptionPayment = async (paymentData: PaymentResponse, userSubscriptionId: string): Promise<void> => {
    try {
      setIsLoading(true);

      const verificationData = {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        userSubscriptionId
      };

      const response = await api.post('/subscription-purchase/verify-payment', verificationData);

      if (response.data?.success) {
        setPaymentStatus('SUCCESS');
      } else {
        throw new Error(response.data?.message || 'Payment verification failed');
      }
    } catch (error) {
      handlePaymentError(error, 'Subscription Payment Verification');
    } finally {
      setIsLoading(false);
    }
  };

  const closePaymentWebView = (): void => {
    setShowPaymentWebView(false);
    setRazorpayOptions(null);
    setPaymentStatus('CANCELLED');
  };

  const contextValue: PaymentContextType = {
    isLoading,
    paymentStatus,
    showPaymentWebView,
    razorpayOptions,
    initiateSubscriptionPurchase,
    initiateRazorpayPayment,
    handlePaymentResponse,
    verifySubscriptionPayment,
    closePaymentWebView,
    generateRazorpayHTML,
    handlePaymentError,
  };

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
};