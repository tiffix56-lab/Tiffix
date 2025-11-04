import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { usePayment, SubscriptionPurchaseData } from '@/context/PaymentContext';
import PaymentWebView from '@/components/payment/PaymentWebView';
import { orderStore, OrderData } from '@/utils/order-store';

const Payment = () => {
  const { colorScheme } = useColorScheme();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const {
    isLoading: paymentLoading,
    showPaymentWebView,
    razorpayOptions,
    initiateSubscriptionPurchase,
    handlePaymentResponse,
    verifySubscriptionPayment,
    closePaymentWebView,
    generateRazorpayHTML,
  } = usePayment();

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
    try {
      console.log('🕐 Converting time from 12h to 24h:', time12h);
      
      // Handle potential formatting issues
      const trimmedTime = time12h.trim();
      const parts = trimmedTime.split(' ');
      
      if (parts.length !== 2) {
        console.error('❌ Invalid time format:', time12h);
        throw new Error(`Invalid time format: ${time12h}`);
      }
      
      const [time, modifier] = parts;
      const timeParts = time.split(':');
      
      if (timeParts.length !== 2) {
        console.error('❌ Invalid time parts:', time);
        throw new Error(`Invalid time parts: ${time}`);
      }
      
      let [hours, minutes] = timeParts;
      let hour24 = parseInt(hours, 10);
      
      if (isNaN(hour24) || hour24 < 1 || hour24 > 12) {
        console.error('❌ Invalid hour value:', hours);
        throw new Error(`Invalid hour value: ${hours}`);
      }
      
      if (modifier.toUpperCase() === 'AM') {
        if (hour24 === 12) {
          hour24 = 0; // 12:00 AM = 00:00
        }
      } else if (modifier.toUpperCase() === 'PM') {
        if (hour24 !== 12) {
          hour24 += 12; // 1:00 PM = 13:00, but 12:00 PM = 12:00
        }
      } else {
        console.error('❌ Invalid modifier:', modifier);
        throw new Error(`Invalid time modifier: ${modifier}`);
      }
      
      // Ensure two-digit format for both hours and minutes
      const formattedHour = hour24.toString().padStart(2, '0');
      const formattedMinutes = minutes.padStart(2, '0');
      const result = `${formattedHour}:${formattedMinutes}`;
      
      console.log('✅ Time conversion successful:', time12h, '→', result);
      return result;
    } catch (error) {
      console.error('❌ Time conversion failed:', error);
      // Return a default time in case of error
      return '12:00';
    }
  };

  const handlePayment = async () => {
    if (!orderData) return;

    try {
      setLoading(true);

      const subscriptionData: SubscriptionPurchaseData = {
        subscriptionId: orderData.subscriptionId,
        promoCode: orderData.promoCode,
        deliveryAddress: {
          street: orderData.deliveryAddress.street || orderData.deliveryAddress.label || "",
          city: orderData.deliveryAddress.city || "",
          state: orderData.deliveryAddress.state || "",
          country: orderData.deliveryAddress.country || "India",
          zipCode: orderData.deliveryAddress.zipCode || "",
          coordinates: {
            type: "Point",
            coordinates: [
              orderData.deliveryAddress.coordinates?.longitude || 0,
              orderData.deliveryAddress.coordinates?.latitude || 0
            ]
          }
        },
        mealTimings: {
          lunch: {
            enabled: orderData.lunchEnabled,
            time: orderData.lunchEnabled ? (() => {
              const converted = convertTo24Hour(orderData.lunchTime);
              console.log('🍽️ Lunch time conversion:', orderData.lunchTime, '→', converted);
              return converted;
            })() : undefined,
          },
          dinner: {
            enabled: orderData.dinnerEnabled,
            time: orderData.dinnerEnabled ? (() => {
              const converted = convertTo24Hour(orderData.dinnerTime);
              console.log('🍽️ Dinner time conversion:', orderData.dinnerTime, '→', converted);
              return converted;
            })() : undefined,
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

      console.log('📦 Complete subscription data being sent:', JSON.stringify(subscriptionData, null, 2));
      
      const result = await initiateSubscriptionPurchase(subscriptionData);

      // Store payment data for verification later
      await orderStore.saveOrderData({
        ...orderData,
        orderId: result.orderId,
        userSubscriptionId: result.userSubscriptionId,
        paymentAmount: 0 // Will be updated from Razorpay response
      });

      setLoading(false);
      // Payment WebView will be shown by PaymentContext
      
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Check if it's a delivery not available error
      if (error.message?.includes('Delivery not available') || error.message?.includes('pincode')) {
        Alert.alert(
          'Delivery Not Available', 
          'Sorry, we don\'t deliver to this address yet. Please select a different address or check back soon!',
          [
            {
              text: 'Select Different Address',
              onPress: () => {
               router.back();
                setTimeout(() => router.back(), 50);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Order Failed', error.message || 'Failed to initiate payment');
      }
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      if (!orderData || !razorpayOptions) return;
      
      await verifySubscriptionPayment(paymentData, razorpayOptions.userSubscriptionId);
      
      // Navigate to order confirmation
      router.push({
        pathname: '/(home)/order-confirmed',
        params: {
          orderId: razorpayOptions.orderId,
          userSubscriptionId: razorpayOptions.userSubscriptionId
        }
      });
    } catch (error) {
      console.error('Payment verification error:', error);
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
                  Razorpay
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
          disabled={loading || paymentLoading}
          className={`rounded-xl py-4 ${
            loading || paymentLoading 
              ? 'bg-zinc-400 dark:bg-zinc-600' 
              : 'bg-green-500'
          }`}>
          {loading || paymentLoading ? (
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
              Continue Payment - {formatCurrency(finalTotal)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Razorpay Payment WebView */}
      {showPaymentWebView && razorpayOptions && (
        <PaymentWebView
          visible={showPaymentWebView}
          razorpayOptions={razorpayOptions}
          onPaymentResponse={(response) => {
            handlePaymentResponse(response);
            if (response.success) {
              handlePaymentSuccess(response);
            }
          }}
          onClose={closePaymentWebView}
          generateHTML={generateRazorpayHTML}
        />
      )}
    </View>
  );
};

export default Payment;