import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const MySubscription = () => {
  const { colorScheme } = useColorScheme();
  const [activeTab, setActiveTab] = useState('current');

  const currentSubscription = {
    title: 'Yearly',
    badge: 'BEST VALUE',
    benefits: ['60 Meals/Month', 'Free Delivery'],
    originalPrice: '₹44000',
    discountedPrice: '₹42000',
    period: 'Yearly',
    startDate: '2024-08-30',
    endDate: '2025-08-30',
  };

  const pastSubscriptions = [
    {
      id: '1',
      title: 'Monthly',
      benefits: ['30 Meals/Month', 'Free Delivery'],
      price: '₹4000',
      period: 'Monthly',
      startDate: '2024-07-01',
      endDate: '2024-07-31',
      status: 'Completed',
    },
    {
      id: '2',
      title: 'Quarterly',
      benefits: ['45 Meals/Month', 'Free Delivery', 'Priority Support'],
      originalPrice: '₹12000',
      discountedPrice: '₹11000',
      period: 'Quarterly',
      startDate: '2024-04-01',
      endDate: '2024-06-30',
      status: 'Completed',
    },
    {
      id: '3',
      title: 'Monthly',
      benefits: ['30 Meals/Month', 'Free Delivery'],
      price: '₹4000',
      period: 'Monthly',
      startDate: '2024-06-01',
      endDate: '2024-06-30',
      status: 'Cancelled',
    },
  ];

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* More top margin */}
      <View className="h-12" />

      {/* Header with more height and rounded back button */}
      <View className="bg-zinc-50 px-6 pb-8 pt-8 dark:bg-neutral-900">
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

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Tab Navigation */}
          <View className="mb-6">
            <View className="overflow-hidden rounded-full border border-gray-200 bg-gray-100 p-1 shadow-sm dark:border-neutral-700 dark:bg-white">
              <View className="relative flex-row">
                {/* Custom indicator */}
                <View
                  className="absolute rounded-full bg-white shadow-sm dark:bg-black"
                  style={{
                    height: 42,
                    width: '50%',
                    left: activeTab === 'current' ? '0%' : '50%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                    zIndex: 1,
                  }}
                />

                {/* Tab buttons */}
                <TouchableOpacity
                  className="flex-1 rounded-full px-6 py-3"
                  onPress={() => setActiveTab('current')}
                  activeOpacity={0.8}
                  style={{ zIndex: 2 }}>
                  <Text
                    className={`text-center text-base font-semibold ${
                      activeTab === 'current'
                        ? 'text-black dark:text-white'
                        : 'text-gray-600 dark:text-gray-900'
                    }`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Current
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 rounded-full px-6 py-3"
                  onPress={() => setActiveTab('past')}
                  activeOpacity={0.8}
                  style={{ zIndex: 2 }}>
                  <Text
                    className={`text-center text-base font-semibold ${
                      activeTab === 'past'
                        ? 'text-black dark:text-white'
                        : 'text-gray-600 dark:text-gray-900'
                    }`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Past
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Subscription Content */}
          {activeTab === 'current' ? (
            <View
              className={`mb-6 rounded-xl border p-6 ${
                colorScheme === 'dark'
                  ? 'border-gray-600 bg-neutral-800'
                  : 'border-gray-200 bg-gray-50'
              }`}>
              {/* Header */}
              <View className="mb-4 flex-row items-center justify-between">
                <Text
                  className="text-xl font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {currentSubscription.title}
                </Text>
                <View className="rounded-md bg-sky-400 px-3 py-1">
                  <Text
                    className="text-xs font-medium text-white"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    {currentSubscription.badge}
                  </Text>
                </View>
              </View>

              {/* Benefits */}
              <View className="mb-4 space-y-2">
                {currentSubscription.benefits.map((benefit, index) => (
                  <View key={index} className="flex-row items-center">
                    <View className="mr-3 h-2 w-2 rounded-full bg-gray-400" />
                    <Text
                      className="text-sm text-gray-600 dark:text-gray-300"
                      style={{ fontFamily: 'Poppins_400Regular' }}>
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Price */}
              <View className="mb-4 items-end">
                <Text
                  className="text-sm text-gray-500 line-through dark:text-gray-400"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  {currentSubscription.originalPrice}
                </Text>
                <Text
                  className="text-2xl font-semibold text-lime-600 dark:text-lime-400"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {currentSubscription.discountedPrice}
                </Text>
                <Text
                  className="text-sm text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  {currentSubscription.period}
                </Text>
              </View>

              {/* Date Range */}
              <View className="mb-6 flex-row items-center">
                <Feather
                  name="calendar"
                  size={16}
                  color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className="ml-2 text-sm text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  {currentSubscription.startDate} to {currentSubscription.endDate}
                </Text>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity className="rounded-lg bg-red-500 py-4">
                <Text
                  className="text-center text-base font-medium text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel Subscription
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-4">
              {pastSubscriptions.map((subscription) => (
                <View
                  key={subscription.id}
                  className={`mb-2 rounded-xl border p-6  ${
                    colorScheme === 'dark'
                      ? 'border-gray-600 bg-neutral-800'
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                  {/* Header */}
                  <View className="mb-4 flex-row items-center justify-between">
                    <Text
                      className="text-xl font-semibold text-black dark:text-white"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {subscription.title}
                    </Text>
                    <View
                      className={`rounded-md px-3 py-1 ${
                        subscription.status === 'Completed' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                      <Text
                        className="text-xs font-medium text-white"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        {subscription.status}
                      </Text>
                    </View>
                  </View>

                  {/* Benefits */}
                  <View className="mb-4 space-y-2">
                    {subscription.benefits.map((benefit, index) => (
                      <View key={index} className="flex-row items-center">
                        <View className="mr-3 h-2 w-2 rounded-full bg-gray-400" />
                        <Text
                          className="text-sm text-gray-600 dark:text-gray-300"
                          style={{ fontFamily: 'Poppins_400Regular' }}>
                          {benefit}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Price */}
                  <View className="mb-4 items-end">
                    {subscription.originalPrice ? (
                      <>
                        <Text
                          className="text-sm text-gray-500 line-through dark:text-gray-400"
                          style={{ fontFamily: 'Poppins_400Regular' }}>
                          {subscription.originalPrice}
                        </Text>
                        <Text
                          className="text-2xl font-semibold text-lime-600 dark:text-lime-400"
                          style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {subscription.discountedPrice}
                        </Text>
                      </>
                    ) : (
                      <Text
                        className="text-2xl font-semibold text-lime-600 dark:text-lime-400"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {subscription.price}
                      </Text>
                    )}
                    <Text
                      className="text-sm text-gray-600 dark:text-gray-300"
                      style={{ fontFamily: 'Poppins_400Regular' }}>
                      {subscription.period}
                    </Text>
                  </View>

                  {/* Date Range */}
                  <View className="mb-6 flex-row items-center">
                    <Feather
                      name="calendar"
                      size={16}
                      color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    />
                    <Text
                      className="ml-2 text-sm text-gray-600 dark:text-gray-300"
                      style={{ fontFamily: 'Poppins_400Regular' }}>
                      {subscription.startDate} to {subscription.endDate}
                    </Text>
                  </View>

                  {/* Renew Button */}
                  <TouchableOpacity className="rounded-lg bg-black py-4 dark:bg-white">
                    <Text
                      className="text-center text-base font-medium text-white dark:text-black"
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      Renew Subscription
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default MySubscription;
