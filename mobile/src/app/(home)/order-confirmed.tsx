import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { subscriptionService } from '@/services/subscription.service';
import LottieView from 'lottie-react-native';
import { orderStore } from '@/utils/order-store';
import { OrderData } from '@/types/order.types';

interface OrderConfirmationData {
  subscriptionId: string;
  userSubscriptionId: string;
  paymentId: string;
  subscription?: any;
  userSubscription?: any;
}

const OrderConfirmed = () => {
  const { colorScheme } = useColorScheme();
  const { subscriptionId, userSubscriptionId, paymentId } = useLocalSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch user subscriptions to get the confirmed order details
      const response = await orderStore.getOrderData();
      console.log("Purchases Res", response);

      setOrderData(response);

    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Helper function to convert 24-hour time to 12-hour format for display
  const format12Hour = (time24: string): string => {
    if (!time24) return ''; // Handle cases where time might be empty
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="bg-zinc-50 px-6 pb-6 pt-24 dark:bg-neutral-900">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.push('/home')}
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
              Order Confirmed
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            <Text className="mt-4 text-base text-zinc-500 dark:text-zinc-400">Loading order details...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Success Message */}
            <View className="items-center px-6 pb-8 pt-8">
              {/* Checkmark Icon */}
              <LottieView
                source={{uri: 'https://lottie.host/cf27b534-e29e-4da7-8407-e7eb75a986d8/aDl1f0fX06.json'}}
                autoPlay
                loop={true}
                style={{ width: '100%', height: 220 }}
              />

              {/* Thank You Text */}
              <Text
                className="mb-2 text-3xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Order Confirmed!
              </Text>
              <Text
                className="mb-8 text-center text-base text-zinc-500 dark:text-zinc-400"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                Your subscription has been activated successfully
              </Text>
            </View>

            {/* Order Details */}
            {orderData && (
              <View className="mx-6 mb-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
                <Text
                  className="mb-4 text-lg font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Subscription Details
                </Text>

                <View className="mb-3 flex-row justify-between">
                  <Text
                    className="text-base text-zinc-600 dark:text-zinc-400"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Subscription ID:
                  </Text>
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    #{orderData.selectedSubscription._id.slice(0, 12).toUpperCase()}
                  </Text>
                </View>

                <View className="mb-3 flex-row justify-between">
                  <Text
                    className="text-base text-zinc-600 dark:text-zinc-400"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Amount Paid:
                  </Text>
                  <Text
                    className="text-base text-green-600 dark:text-green-400"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {formatCurrency(orderData.selectedSubscription.discountedPrice || 0)}
                  </Text>
                </View>

                <View className="mb-3 flex-row justify-between">
                  <Text
                    className="text-base text-zinc-600 dark:text-zinc-400"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Start Date:
                  </Text>
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {orderData.deliveryDate}
                  </Text>
                </View>

                <View className="mb-3 flex-row justify-between">
                  <Text
                    className="text-base text-zinc-600 dark:text-zinc-400"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Time
                  </Text>
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {orderData.lunchEnabled ? `Lunch: ${format12Hour(orderData.lunchTime)}` : ''} {orderData.dinnerEnabled ? `Dinner: ${format12Hour(orderData.dinnerTime)}` : ''}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text
                    className="text-base text-zinc-600 dark:text-zinc-400"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Meal Credits:
                  </Text>
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {orderData.selectedSubscription.mealsPerPlan} meals
                  </Text>
                </View>
                {
                  orderData.referralCode && (
                  <View className="flex-row justify-between">
                    <Text
                      className="text-base text-zinc-600 dark:text-zinc-400"
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      Referral Code:
                    </Text>
                    <Text
                      className="text-base text-black dark:text-white"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {orderData.referralCode} 
                    </Text>
                  </View> )
                }
              </View>
            )}

          </ScrollView>
        )}
      </View>

      {/* Back to Home Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={() => router.push('/home')}
          className="rounded-xl bg-black py-4 dark:bg-white">
          <Text
            className="text-center text-lg font-semibold text-white dark:text-black"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderConfirmed;
