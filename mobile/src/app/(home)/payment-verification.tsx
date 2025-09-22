import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const PaymentVerification = () => {
  const { colorScheme } = useColorScheme();
  const { orderId, userSubscriptionId, status } = useLocalSearchParams();
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    // This screen is mainly for legacy support
    // Razorpay payments are handled directly in the WebView
    // Redirect based on status after a short delay
    const timer = setTimeout(() => {
      setRedirecting(false);
      
      if (status === 'success') {
        // Redirect to order confirmation
        router.replace({
          pathname: '/(home)/order-confirmed',
          params: { orderId, userSubscriptionId }
        });
      } else {
        // Redirect back to payment screen for retry
        router.back();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [status, orderId, userSubscriptionId]);

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="bg-zinc-50 px-6 pb-6 pt-24 dark:bg-neutral-900">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
            <Feather
              name="arrow-left"
              size={20}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text
              className="text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Payment Status
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <View className="flex-1 items-center justify-center px-6">
          {redirecting ? (
            <>
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              <Text
                className="mt-6 text-center text-lg font-medium text-black dark:text-white"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                Processing payment result...
              </Text>
              <Text
                className="mt-2 text-center text-base text-zinc-500 dark:text-zinc-400"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                Please wait while we confirm your payment
              </Text>
            </>
          ) : (
            <>
              <View className={`rounded-full p-6 ${
                status === 'success' 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-red-100 dark:bg-red-900'
              }`}>
                <Feather
                  name={status === 'success' ? 'check' : 'x'}
                  size={48}
                  color={status === 'success' ? '#22C55E' : '#EF4444'}
                />
              </View>
              <Text
                className={`mt-6 text-center text-xl font-semibold ${
                  status === 'success' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {status === 'success' ? 'Payment Successful!' : 'Payment Failed'}
              </Text>
              <Text
                className="mt-2 text-center text-base text-zinc-500 dark:text-zinc-400"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                {status === 'success' 
                  ? 'Your subscription has been activated successfully'
                  : 'Please try again or contact support'
                }
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default PaymentVerification;