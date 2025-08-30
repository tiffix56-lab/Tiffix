import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import RazorpayCheckout from 'react-native-razorpay';
import { orderService, RazorpayOrderResponse } from '@/services/order.service';
import { MenuItem } from '@/types/menu.types';
import { Subscription } from '@/services/subscription.service';
import { Address } from '@/types/address.types';

interface OrderData {
  menuId: string;
  subscriptionId: string;
  selectedMenu: MenuItem;
  selectedSubscription: Subscription;
  deliveryAddress: Address;
  deliveryDate: string;
  lunchTime: string;
  dinnerTime: string;
  lunchEnabled: boolean;
  dinnerEnabled: boolean;
}

const OrderInformation = () => {
  const { colorScheme } = useColorScheme();
  const { orderData } = useLocalSearchParams();
  const [parsedOrderData, setParsedOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (orderData) {
      try {
        const parsed = JSON.parse(orderData as string);
        setParsedOrderData(parsed);
      } catch (err) {
        console.error('Failed to parse order data:', err);
        Alert.alert('Error', 'Invalid order data');
        router.back();
      }
    }
  }, [orderData]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculateTax = (price: number) => {
    return Math.round(price * 0.18); // 18% GST
  };

  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    return `${hours}:${minutes}`;
  };

  const handleConfirmOrder = async () => {
    if (!parsedOrderData) return;

    try {
      setLoading(true);

      // Step 1: Initiate purchase to get Razorpay order
      const orderPayload = {
        subscriptionId: parsedOrderData.subscriptionId,
        deliveryAddress: {
          label: parsedOrderData.deliveryAddress.label,
          street: parsedOrderData.deliveryAddress.street,
          city: parsedOrderData.deliveryAddress.city,
          state: parsedOrderData.deliveryAddress.state,
          zipCode: parsedOrderData.deliveryAddress.zipCode,
          coordinates: parsedOrderData.deliveryAddress.coordinates,
        },
        mealTimings: {
          lunch: {
            enabled: parsedOrderData.lunchEnabled,
            time: parsedOrderData.lunchEnabled ? convertTo24Hour(parsedOrderData.lunchTime) : '',
          },
          dinner: {
            enabled: parsedOrderData.dinnerEnabled,
            time: parsedOrderData.dinnerEnabled ? convertTo24Hour(parsedOrderData.dinnerTime) : '',
          },
        },
        startDate: parsedOrderData.deliveryDate,
      };

      const response = await orderService.initiatePurchase(orderPayload);

      if (response.success && response.data) {
        const { orderId, amount, currency, razorpayKey, userSubscriptionId } = response.data;

        // Step 2: Open Razorpay payment gateway
        const options = {
          description: `${parsedOrderData.selectedSubscription.planName} Subscription`,
          image: 'https://your-logo-url.com/logo.png', // Replace with your app logo
          currency: currency,
          key: razorpayKey,
          amount: amount,
          name: 'Tiffix',
          order_id: orderId,
          prefill: {
            email: '', // Get from user context if available
            contact: '', // Get from user context if available
            name: '', // Get from user context if available
          },
          theme: { color: '#000000' },
        };

        RazorpayCheckout.open(options)
          .then((data: any) => {
            // Step 3: Payment successful - verify with backend
            handlePaymentSuccess(data, userSubscriptionId);
          })
          .catch((error: any) => {
            // Payment failed or cancelled
            console.error('Razorpay payment error:', error);
            if (error.description !== 'Payment cancelled by user') {
              Alert.alert('Payment Failed', error.description || 'Payment could not be processed');
            }
            setLoading(false);
          });
      } else {
        Alert.alert('Order Failed', response.message || 'Failed to initiate payment');
        setLoading(false);
      }
    } catch (error) {
      console.error('Order confirmation error:', error);
      Alert.alert('Error', 'Something went wrong while placing your order');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any, userSubscriptionId: string) => {
    try {
      const verificationData = {
        userSubscriptionId,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      };

      const verificationResponse = await orderService.verifyPayment(verificationData);

      if (verificationResponse.success && verificationResponse.data?.success) {
        // Payment verified successfully
        router.push({
          pathname: '/order-confirmed',
          params: {
            subscriptionId: verificationResponse.data.userSubscriptionId,
            userSubscriptionId: userSubscriptionId,
            paymentId: paymentData.razorpay_payment_id,
          }
        });
      } else {
        Alert.alert(
          'Payment Verification Failed',
          'Your payment was processed but could not be verified. Please contact support.'
        );
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      Alert.alert(
        'Verification Error',
        'Payment verification failed. Please contact support if amount was deducted.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!parsedOrderData) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

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
              Order Information
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Illustration Section */}
          <Image
            source={require('../../assets/order-information.png')}
            className="my-8 h-48 w-full"
            resizeMode="contain"
          />

          {/* Order Details Card */}
          <View className="mx-6 mb-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
            {/* Selected Menu */}
            {parsedOrderData.selectedMenu && (
              <>
                <View className="mb-4">
                  <Text
                    className="mb-2 text-lg font-semibold text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Selected Meal
                  </Text>
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    {parsedOrderData.selectedMenu.foodTitle}
                  </Text>
                  <Text
                    className="text-sm text-zinc-500 dark:text-zinc-400"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    {parsedOrderData.selectedMenu.description.short}
                  </Text>
                </View>
                <View className="mb-4 h-px bg-zinc-200 dark:bg-zinc-700" />
              </>
            )}
            
            {/* Subscription Details */}
            <View className="mb-4">
              <View className="mb-3 flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Subscription Plan:
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {parsedOrderData.selectedSubscription.planName}
                </Text>
              </View>
              <View className="mb-3 flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Duration:
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {parsedOrderData.selectedSubscription.durationDays} days
                </Text>
              </View>
              <View className="mb-3 flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Start Date:
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {parsedOrderData.deliveryDate}
                </Text>
              </View>
              <View className="mb-3 flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Meal Times:
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {[
                    parsedOrderData.lunchEnabled ? `Lunch: ${parsedOrderData.lunchTime}` : null,
                    parsedOrderData.dinnerEnabled ? `Dinner: ${parsedOrderData.dinnerTime}` : null
                  ].filter(Boolean).join(', ')}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Address:
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {parsedOrderData.deliveryAddress.label}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="mb-4 h-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Price Breakdown */}
            <View className="mb-4">
              <View className="mb-3 flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Price:
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {formatCurrency(parsedOrderData.selectedSubscription.discountedPrice)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Tax (18% GST):
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {formatCurrency(calculateTax(parsedOrderData.selectedSubscription.discountedPrice))}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="mb-4 h-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Total */}
            <View className="flex-row justify-between">
              <Text
                className="text-lg font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Total:
              </Text>
              <Text
                className="text-lg font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {formatCurrency(
                  parsedOrderData.selectedSubscription.discountedPrice + 
                  calculateTax(parsedOrderData.selectedSubscription.discountedPrice)
                )}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Confirm Order Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={handleConfirmOrder}
          disabled={loading}
          className={`rounded-xl py-4 ${
            loading 
              ? 'bg-zinc-400 dark:bg-zinc-600' 
              : 'bg-black dark:bg-white'
          }`}>
          {loading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text
                className="ml-2 text-center text-lg font-semibold text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Processing...
              </Text>
            </View>
          ) : (
            <Text
              className="text-center text-lg font-semibold text-white dark:text-black"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Confirm Order
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderInformation;
