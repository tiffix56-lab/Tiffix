import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const Subscription = () => {
  const { colorScheme } = useColorScheme();
  const [selectedPlan, setSelectedPlan] = useState('1 Year');

  const plans = [
    {
      id: '1 Year',
      title: '1 Year',
      meals: '60 Meals/Month',
      delivery: 'Delivery Free',
      price: '₹42000',
      savings: '₹1800',
      badge: 'BEST VALUE',
      originalPrice: '₹44000',
      period: 'Yearly',
    },
    {
      id: '3 Months',
      title: '3 Months',
      meals: '60 Meals/Month',
      delivery: 'Delivery Free',
      price: '₹3000',
      savings: '₹600',
      badge: 'MOST POPULAR',
      originalPrice: '₹3600',
      period: 'Quarterly',
    },
    {
      id: '1 Month',
      title: '1 Month',
      meals: '60 Meals',
      delivery: 'Delivery Free',
      price: '₹800',
      savings: '₹40',
      originalPrice: '₹840',
      period: 'Monthly',
    },
  ];

  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan);

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
              Subscription
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Choose Your Plan */}
          <Text
            className="mb-6 text-2xl font-semibold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Choose Your Plan
          </Text>

          {/* Plan Cards */}
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              className={`mb-4 rounded-xl p-4 ${
                selectedPlan === plan.id
                  ? 'border border-zinc-200 bg-neutral-900 dark:border-zinc-700 dark:bg-neutral-900'
                  : 'border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-black'
              }`}>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="mb-2 flex-row items-center">
                    <Text
                      className={`text-xl font-semibold ${
                        selectedPlan === plan.id
                          ? 'text-zinc-50 dark:text-zinc-50'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {plan.title}
                    </Text>
                    {plan.badge && (
                      <View className="ml-3 rounded-full bg-blue-500 px-3 py-1">
                        <Text
                          className="text-xs font-medium text-zinc-50"
                          style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {plan.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    className={`text-base ${
                      selectedPlan === plan.id
                        ? 'text-zinc-50 dark:text-zinc-50'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    No. of meals: {plan.meals}
                  </Text>
                  <Text
                    className={`text-base ${
                      selectedPlan === plan.id
                        ? 'text-green-400 dark:text-green-600'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    {plan.delivery}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className={`text-lg line-through ${
                      selectedPlan === plan.id
                        ? 'text-zinc-500 dark:text-zinc-400'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    {plan.originalPrice}
                  </Text>
                  <Text
                    className={`text-2xl font-semibold ${
                      selectedPlan === plan.id
                        ? 'text-green-400 dark:text-green-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {plan.price}
                  </Text>
                  <Text
                    className={`text-sm ${
                      selectedPlan === plan.id
                        ? 'text-zinc-500 dark:text-zinc-400'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    {plan.period}
                  </Text>
                </View>
              </View>
              <Text
                className={`mt-2 text-sm ${
                  selectedPlan === plan.id
                    ? 'text-green-400 dark:text-green-600'
                    : 'text-green-600 dark:text-green-400'
                }`}
                style={{ fontFamily: 'Poppins_500Medium' }}>
                You Save : ₹{plan.savings}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Price Summary */}
          <View className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <View className="mb-2 flex-row justify-between">
              <Text
                className="text-base text-black dark:text-white"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                Price:
              </Text>
              <Text
                className="text-base text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {selectedPlanData?.price}
              </Text>
            </View>
            <View className="mb-2 flex-row justify-between">
              <Text
                className="text-base text-black dark:text-white"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                Tax:
              </Text>
              <Text
                className="text-base text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                ₹392
              </Text>
            </View>
            <View className="border-t border-zinc-200 pt-2 dark:border-zinc-700">
              <View className="flex-row justify-between">
                <Text
                  className="text-lg font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Total:
                </Text>
                <Text
                  className="text-lg font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  ₹42392
                </Text>
              </View>
            </View>
          </View>

          {/* Subscription Terms */}
          <View className="mb-8 mt-6">
            <Text
              className="text-xs leading-4 text-zinc-500 dark:text-zinc-400"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              Payment will be charged to your iTunes account at confirmation of purchase. Your
              account will be charged within 24 hours prior to the end of the current period for
              $8.4/montihs. Subscriptions automatically renew unless auto-renew is turned off at
              least 24 hours before the end of the current period. You can cancel automatic renewal
              at any time via your settings in the tunes store after purchase.
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Confirm Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={() => router.push('/information')}
          className="rounded-xl bg-black py-4 dark:bg-white">
          <Text
            className="text-center text-lg font-semibold text-white dark:text-black"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Confirm
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Subscription;
