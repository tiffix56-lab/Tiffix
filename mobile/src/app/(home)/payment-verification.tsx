import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, Alert, AppState } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { orderService } from '@/services/order.service';
import { orderStore } from '@/utils/order-store';

const PaymentVerification = () => {
  const { colorScheme } = useColorScheme();
  const { orderId, userSubscriptionId, amount } = useLocalSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [manualCheck, setManualCheck] = useState(false);

  useEffect(() => {
    // Listen for app state changes to detect when user returns from PhonePe
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && !verifying && !manualCheck) {
        // User returned to app, check payment status
        checkPaymentStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Auto-check after a delay
    const timeout = setTimeout(() => {
      if (!verifying) {
        checkPaymentStatus();
      }
    }, 3000);

    return () => {
      subscription?.remove();
      clearTimeout(timeout);
    };
  }, []);

  const checkPaymentStatus = async () => {
    try {
      setVerifying(true);
      
      // For PhonePe, we need to manually verify the payment
      // This would typically involve checking the transaction status
      const verificationData = {
        userSubscriptionId: userSubscriptionId as string,
        phonepe_transaction_id: orderId as string,
        phonepe_merchant_id: process.env.EXPO_PUBLIC_PHONEPE_MERCHANT_ID || '',
        phonepe_checksum: '', // This would come from PhonePe callback
      };

      const response = await orderService.verifyPayment(verificationData);

      if (response.success) {
        // Clear order data
        await orderStore.clearOrderData();
        
        // Navigate to success screen
        router.replace({
          pathname: '/(home)/order-confirmed',
          params: {
            subscriptionId: '',
            userSubscriptionId: userSubscriptionId as string,
            paymentId: orderId as string,
          },
        });
      } else {
        setManualCheck(true);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setManualCheck(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerification = () => {
    Alert.alert(
      'Payment Status',
      'Did you complete the payment successfully in PhonePe?',
      [
        {
          text: 'Payment Failed',
          style: 'cancel',
          onPress: () => {
            router.back(); // Go back to payment screen
          }
        },
        {
          text: 'Payment Successful',
          onPress: async () => {
            // Navigate to success screen even if verification pending
            await orderStore.clearOrderData();
            router.replace({
              pathname: '/(home)/order-confirmed',
              params: {
                subscriptionId: '',
                userSubscriptionId: userSubscriptionId as string,
                paymentId: orderId as string,
              },
            });
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="bg-zinc-50 px-6 pb-6 pt-24 dark:bg-neutral-900">
        <View className="flex-row items-center">
          <View className="flex-1 items-center">
            <Text
              className="text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Payment Verification
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <View className="flex-1 items-center justify-center px-6">
          {verifying ? (
            <>
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              <Text
                className="mt-4 text-center text-lg font-medium text-black dark:text-white"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                Verifying Payment...
              </Text>
              <Text
                className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                Please wait while we confirm your payment
              </Text>
            </>
          ) : manualCheck ? (
            <>
              <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-blue-500">
                <Feather name="credit-card" size={48} color="#FFFFFF" />
              </View>
              <Text
                className="mb-2 text-center text-xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Payment Status Check
              </Text>
              <Text
                className="mb-8 text-center text-base text-zinc-500 dark:text-zinc-400"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                We're having trouble verifying your payment automatically. Please let us know the status.
              </Text>
              
              <View className="w-full space-y-4">
                <TouchableOpacity
                  onPress={handleManualVerification}
                  className="rounded-xl bg-blue-500 py-4">
                  <Text
                    className="text-center text-lg font-semibold text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Check Payment Status
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="rounded-xl border border-zinc-200 py-4 dark:border-zinc-700">
                  <Text
                    className="text-center text-lg font-medium text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Back to Payment
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-green-500">
                <Feather name="check" size={48} color="#FFFFFF" />
              </View>
              <Text
                className="mb-2 text-center text-xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Payment Initiated
              </Text>
              <Text
                className="mb-8 text-center text-base text-zinc-500 dark:text-zinc-400"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                Complete your payment in PhonePe app and return here
              </Text>
              
              <TouchableOpacity
                onPress={checkPaymentStatus}
                className="w-full rounded-xl bg-black py-4 dark:bg-white">
                <Text
                  className="text-center text-lg font-semibold text-white dark:text-black"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  I've Completed Payment
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default PaymentVerification;