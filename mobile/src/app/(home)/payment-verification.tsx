import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, Alert, AppState, Linking } from 'react-native';
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

    // Listen for deep links (when PhonePe redirects back)
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      if (url.includes('payment-success') || url.includes('payment-complete')) {
        checkPaymentStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Listen for initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for incoming URLs while app is running
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });
    
    // Auto-check after a delay
    const timeout = setTimeout(() => {
      if (!verifying) {
        checkPaymentStatus();
      }
    }, 3000);

    return () => {
      subscription?.remove();
      linkingSubscription?.remove();
      clearTimeout(timeout);
    };
  }, []);

  const checkPaymentStatus = async () => {
    try {
      setVerifying(true);
      
      console.log('Checking payment status for orderId:', orderId);

      // First check payment status using orderId (more reliable)
      const paymentStatusResponse = await orderService.checkPaymentStatus(orderId as string);

      if (paymentStatusResponse.success && paymentStatusResponse.data) {
        const { status, paymentStatus, subscription } = paymentStatusResponse.data;
        
        console.log('Payment status check result:', { status, paymentStatus });
        
        if (status === 'success' && paymentStatus === 'completed') {
          // Payment was successful and processed
          await orderStore.clearOrderData();
          
          Alert.alert(
            'Payment Successful!',
            'Your subscription has been activated successfully.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  router.replace({
                    pathname: '/(home)/order-confirmed',
                    params: {
                      subscriptionId: '',
                      userSubscriptionId: subscription?.id || userSubscriptionId as string,
                      paymentId: orderId as string,
                    },
                  });
                }
              }
            ]
          );
          return;
        } else if (status === 'failed') {
          console.log('Payment failed');
          Alert.alert(
            'Payment Failed',
            'Your payment was not successful. Please try again.',
            [
              {
                text: 'Try Again',
                onPress: () => router.back()
              }
            ]
          );
          return;
        }
      }

      // Fallback: Check subscription status if payment status check fails
      console.log('Fallback: Checking subscription status');
      const statusResponse = await orderService.checkSubscriptionStatus(userSubscriptionId as string);

      if (statusResponse.success && statusResponse.data) {
        const subscription = statusResponse.data.subscription;
        const status = subscription?.status || statusResponse.data.status;
        
        console.log('Current subscription status:', status);
        
        if (status === 'active') {
          // Payment was successful and webhook processed it
          await orderStore.clearOrderData();
          
          Alert.alert(
            'Payment Successful!',
            'Your subscription has been activated successfully.',
            [
              {
                text: 'Continue',
                onPress: () => {
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
        } else if (status === 'pending') {
          console.log('Subscription still pending - webhook may not have processed yet');
          // Give webhook more time to process
          setTimeout(() => {
            if (!manualCheck) {
              setManualCheck(true);
            }
          }, 5000);
        } else {
          console.log('Subscription status unexpected:', status);
          setManualCheck(true);
        }
      } else {
        console.log('Failed to check subscription status:', statusResponse.message);
        // Fallback to manual check
        setManualCheck(true);
      }
    } catch (error) {
      console.error('Status check error:', error);
      // Give webhook more time or show manual check
      setTimeout(() => {
        if (!manualCheck) {
          setManualCheck(true);
        }
      }, 5000);
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