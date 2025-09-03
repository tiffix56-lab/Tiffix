import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { MenuItem } from '@/types/menu.types';
import { Subscription } from '@/services/subscription.service';
import { Address } from '@/types/address.types';
import { orderStore, OrderData } from '@/utils/order-store';

const OrderInformation = () => {
  const { colorScheme } = useColorScheme();
  const [parsedOrderData, setParsedOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        const data = await orderStore.getOrderData();
        if (data) {
          setParsedOrderData(data);
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

  const handleProceedToPayment = () => {
    if (!parsedOrderData) {
      return;
    }

    router.push('/(home)/payment');
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
                    style={{ fontFamily: 'Poppins_500Medium' }}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {parsedOrderData.selectedMenu.foodTitle}
                  </Text>
                  <Text
                    className="text-sm text-zinc-500 dark:text-zinc-400"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                    numberOfLines={3}
                    ellipsizeMode="tail">
                    {parsedOrderData.selectedMenu.description.short}
                  </Text>
                </View>
                <View className="mb-4 h-px bg-zinc-200 dark:bg-zinc-700" />
              </>
            )}
            
            {/* Subscription Details */}
            <View className="mb-4">
              <View className="mb-3 flex-row justify-between items-start">
                <Text
                  className="text-base text-black dark:text-white flex-shrink-0"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Subscription Plan:
                </Text>
                <Text
                  className="text-base text-black dark:text-white flex-1 text-right ml-2"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                  numberOfLines={2}
                  ellipsizeMode="tail">
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
              <View className="mb-3">
                <Text
                  className="text-base text-black dark:text-white mb-2"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Meal Times:
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                  numberOfLines={2}
                  ellipsizeMode="tail">
                  {[
                    parsedOrderData.lunchEnabled ? `Lunch: ${parsedOrderData.lunchTime}` : null,
                    parsedOrderData.dinnerEnabled ? `Dinner: ${parsedOrderData.dinnerTime}` : null
                  ].filter(Boolean).join(', ')}
                </Text>
              </View>
              <View>
                <Text
                  className="text-base text-black dark:text-white mb-2"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Address:
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                  numberOfLines={3}
                  ellipsizeMode="tail">
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
          onPress={handleProceedToPayment}
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
              Proceed to Payment
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderInformation;