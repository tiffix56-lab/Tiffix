import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { orderService } from '@/services/order.service';

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
  const [orderData, setOrderData] = useState<OrderConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch user subscriptions to get the confirmed order details
      const response = await orderService.getUserSubscriptions();
      
      if (response.success && response.data) {
        // Find the subscription that was just created
        const latestSubscription = response.data.subscriptions.find(
          (sub: any) => sub._id === subscriptionId || sub.subscriptionId === subscriptionId
        );
        
        setOrderData({
          subscriptionId: subscriptionId as string,
          userSubscriptionId: userSubscriptionId as string,
          paymentId: paymentId as string,
          userSubscription: latestSubscription,
        });
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
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
              <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-green-500">
                <Feather name="check" size={48} color="#FFFFFF" />
              </View>

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
            {orderData?.userSubscription && (
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
                    #{orderData.userSubscription._id.slice(-8).toUpperCase()}
                  </Text>
                </View>

                <View className="mb-3 flex-row justify-between">
                  <Text
                    className="text-base text-zinc-600 dark:text-zinc-400"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Payment ID:
                  </Text>
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    #{paymentId?.toString().slice(-8).toUpperCase()}
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
                    {formatCurrency(orderData.userSubscription.finalPrice)}
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
                    {new Date(orderData.userSubscription.startDate).toLocaleDateString('en-IN')}
                  </Text>
                </View>

                <View className="mb-3 flex-row justify-between">
                  <Text
                    className="text-base text-zinc-600 dark:text-zinc-400"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    End Date:
                  </Text>
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {new Date(orderData.userSubscription.endDate).toLocaleDateString('en-IN')}
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
                    {orderData.userSubscription.creditsGranted} meals
                  </Text>
                </View>
              </View>
            )}

            {/* Next Steps */}
            <View className="mx-6 mb-8 rounded-2xl bg-green-50 p-6 dark:bg-green-900/20">
              <Text
                className="mb-4 text-lg font-semibold text-green-800 dark:text-green-200"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                What's Next?
              </Text>
              <View className="flex-row items-start">
                <View className="mr-3 mt-1 h-2 w-2 rounded-full bg-green-600" />
                <Text
                  className="flex-1 text-sm text-green-700 dark:text-green-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  You'll receive meal deliveries as per your selected schedule
                </Text>
              </View>
              <View className="mt-2 flex-row items-start">
                <View className="mr-3 mt-1 h-2 w-2 rounded-full bg-green-600" />
                <Text
                  className="flex-1 text-sm text-green-700 dark:text-green-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  Track your subscription and manage deliveries in the app
                </Text>
              </View>
              <View className="mt-2 flex-row items-start">
                <View className="mr-3 mt-1 h-2 w-2 rounded-full bg-green-600" />
                <Text
                  className="flex-1 text-sm text-green-700 dark:text-green-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  Contact support if you have any questions
                </Text>
              </View>
            </View>
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
