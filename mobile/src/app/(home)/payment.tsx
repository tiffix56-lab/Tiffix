import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { orderService } from '@/services/order.service';
import { orderStore, OrderData } from '@/utils/order-store';
import { InitiatePurchaseRequest } from '@/types/order.types';

const Payment = () => {
  const { colorScheme } = useColorScheme();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        const data = await orderStore.getOrderData();
        if (data) {
          setOrderData(data);
        } else {
          Alert.alert('Error', 'Order data not found');
          router.back();
        }
      } catch (err) {
        console.error('Failed to load order data:', err);
        Alert.alert('Error', 'Failed to load order data');
        router.back();
      }
    };

    loadOrderData();
  }, []);

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

  const handlePayment = async () => {
    if (!orderData) return;

    try {
      setLoading(true);

      const orderPayload: InitiatePurchaseRequest = {
        subscriptionId: orderData.subscriptionId,
        deliveryAddress: {
          label: orderData.deliveryAddress.label,
          street: orderData.deliveryAddress.street,
          city: orderData.deliveryAddress.city,
          state: orderData.deliveryAddress.state,
          zipCode: orderData.deliveryAddress.zipCode,
          coordinates: orderData.deliveryAddress.coordinates,
        },
        mealTimings: {
          lunch: {
            enabled: orderData.lunchEnabled,
            time: orderData.lunchEnabled ? convertTo24Hour(orderData.lunchTime) : undefined,
          },
          dinner: {
            enabled: orderData.dinnerEnabled,
            time: orderData.dinnerEnabled ? convertTo24Hour(orderData.dinnerTime) : undefined,
          },
        },
        startDate: (() => {
          const dateStr = orderData.deliveryDate;
          const months = {
            'January': 0, 'February': 1, 'March': 2, 'April': 3,
            'May': 4, 'June': 5, 'July': 6, 'August': 7,
            'September': 8, 'October': 9, 'November': 10, 'December': 11
          };
          
          const parts = dateStr.split(' ');
          if (parts.length === 3) {
            const month = months[parts[0] as keyof typeof months];
            const day = parseInt(parts[1].replace(',', ''));
            const year = parseInt(parts[2]);
            const date = new Date(year, month, day);
            return date.toISOString();
          }
          
          return new Date(dateStr).toISOString();
        })(),
      };

      const response = await orderService.initiatePurchase(orderPayload);

      if (response.success && response.data) {
        const { orderId, amount, currency, phonepeKey, userSubscriptionId, paymentUrl } = response.data;

        // Store payment data for verification later
        await orderStore.setOrderData({
          ...orderData,
          orderId,
          userSubscriptionId,
          paymentAmount: amount
        });

        // Open PhonePe payment URL
        if (paymentUrl) {
          const supported = await Linking.canOpenURL(paymentUrl);
          if (supported) {
            await Linking.openURL(paymentUrl);
            
            // Navigate to payment verification screen
            router.push({
              pathname: '/(home)/payment-verification',
              params: {
                orderId,
                userSubscriptionId,
                amount: amount.toString()
              }
            });
          } else {
            Alert.alert('Error', 'Cannot open PhonePe payment URL');
            setLoading(false);
          }
        } else {
          Alert.alert('Error', 'Payment URL not received from PhonePe');
          setLoading(false);
        }
      } else {
        Alert.alert('Order Failed', response.message || 'Failed to initiate payment');
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Something went wrong while processing payment');
      setLoading(false);
    }
  };


  if (!orderData) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

  const totalPrice = orderData.selectedSubscription.discountedPrice;
  const tax = calculateTax(totalPrice);
  const finalTotal = totalPrice + tax;

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
              Payment
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Payment Summary */}
          <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
            <Text
              className="mb-4 text-lg font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Payment Summary
            </Text>

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text
                  className="text-base text-zinc-600 dark:text-zinc-400"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  {orderData.selectedSubscription.planName}
                </Text>
                <Text
                  className="text-base font-medium text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  {formatCurrency(totalPrice)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text
                  className="text-base text-zinc-600 dark:text-zinc-400"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  Tax (18% GST)
                </Text>
                <Text
                  className="text-base font-medium text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  {formatCurrency(tax)}
                </Text>
              </View>

              <View className="h-px bg-zinc-200 dark:bg-zinc-700" />

              <View className="flex-row justify-between">
                <Text
                  className="text-lg font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Total Amount
                </Text>
                <Text
                  className="text-lg font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {formatCurrency(finalTotal)}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
            <Text
              className="mb-4 text-lg font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Payment Method
            </Text>
            
            <View className="flex-row items-center rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                <Feather name="credit-card" size={20} color="#FFFFFF" />
              </View>
              <View className="ml-3 flex-1">
                <Text
                  className="text-base font-medium text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  PhonePe
                </Text>
                <Text
                  className="text-sm text-zinc-500 dark:text-zinc-400"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  UPI, Cards, Net Banking & More
                </Text>
              </View>
              <Feather name="check-circle" size={20} color="#10B981" />
            </View>
          </View>

          {/* Order Details */}
          <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
            <Text
              className="mb-4 text-lg font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Order Details
            </Text>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Plan:</Text>
                <Text className="text-sm font-medium text-black dark:text-white">
                  {orderData.selectedSubscription.planName}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Duration:</Text>
                <Text className="text-sm font-medium text-black dark:text-white">
                  {orderData.selectedSubscription.durationDays} days
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Start Date:</Text>
                <Text className="text-sm font-medium text-black dark:text-white">
                  {orderData.deliveryDate}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Address:</Text>
                <Text className="text-sm font-medium text-black dark:text-white flex-1 text-right">
                  {orderData.deliveryAddress.label}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Pay Now Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={handlePayment}
          disabled={loading}
          className={`rounded-xl py-4 ${
            loading 
              ? 'bg-zinc-400 dark:bg-zinc-600' 
              : 'bg-green-500'
          }`}>
          {loading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text
                className="ml-2 text-center text-lg font-semibold text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Processing Payment...
              </Text>
            </View>
          ) : (
            <Text
              className="text-center text-lg font-semibold text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Pay {formatCurrency(finalTotal)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Payment;