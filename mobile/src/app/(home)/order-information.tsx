import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { MenuItem } from '@/types/menu.types';
import { Subscription } from '@/services/subscription.service';
import { Address } from '@/types/address.types';
import { orderStore, OrderData } from '@/utils/order-store';
import LottieView from 'lottie-react-native';

const OrderInformation = () => {
  const { colorScheme } = useColorScheme();
  const [parsedOrderData, setParsedOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

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

  // Helper function to convert 24-hour time to 12-hour format for display
  const format12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);

    try {


      const upperCoupon = couponCode.toUpperCase();
      setAppliedCoupon(upperCoupon);

    } catch (error) {
      Alert.alert('Error', 'Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setDiscount(0);
  };

  const handleProceedToPayment = async () => {
    if (!parsedOrderData) {
      return;
    }

    // Save updated order data with coupon info
    await orderStore.saveOrderData({
      ...parsedOrderData,
      referralCode: appliedCoupon || undefined,
    });

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
          <LottieView
            source={{ uri: "https://lottie.host/fbce4b64-8b86-4f3e-88e2-263b5a52640c/8r9mra6RuK.json" }}
            autoPlay
            loop
            style={{ width: '100%', height: 200 }}
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
                    parsedOrderData.lunchEnabled ? `Lunch: ${format12Hour(parsedOrderData.lunchTime)}` : null,
                    parsedOrderData.dinnerEnabled ? `Dinner: ${format12Hour(parsedOrderData.dinnerTime)}` : null
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
                  {parsedOrderData.deliveryAddress.street}, {parsedOrderData.deliveryAddress.city}, {parsedOrderData.deliveryAddress.state}, {parsedOrderData.deliveryAddress.zipCode}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="mb-4 h-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Coupon Code Section */}
            <View className="mb-4">
              <Text
                className="mb-3 text-base font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Have a Referral Code?
              </Text>

              {!appliedCoupon ? (
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 rounded-xl border border-zinc-200 uppercase bg-white px-4 py-3 text-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="Enter referral code"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={couponCode}
                    onChangeText={setCouponCode}
                    style={{ fontFamily: 'Poppins_400Regular', fontSize: 14 }}
                    autoCapitalize="characters"
                    editable={!applyingCoupon}
                  />
                  <TouchableOpacity
                    onPress={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className={`rounded-xl px-6 py-3 ${
                      applyingCoupon || !couponCode.trim()
                        ? 'bg-zinc-300 dark:bg-zinc-600'
                        : 'bg-green-500'
                    }`}>
                    {applyingCoupon ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text
                        className="text-sm font-semibold text-white"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Apply
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-600 dark:bg-green-900/20">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center">
                      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-green-500">
                        <Feather name="check" size={20} color="#FFFFFF" />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-sm font-semibold text-green-700 dark:text-green-300"
                          style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {appliedCoupon} Applied
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={handleRemoveCoupon}
                      className="ml-2 rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                      <Feather name="x" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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

              {discount > 0 && (
                <View className="mb-3 flex-row justify-between">
                  <Text
                    className="text-base text-green-600 dark:text-green-400"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Discount:
                  </Text>
                  <Text
                    className="text-base text-green-600 dark:text-green-400"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    - {formatCurrency(discount)}
                  </Text>
                </View>
              )}

              
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
                  (parsedOrderData.selectedSubscription.discountedPrice - discount)
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