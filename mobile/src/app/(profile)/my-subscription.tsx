import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { orderService } from '@/services/order.service';
import { UserSubscription } from '@/types/userSubscription.types';

const MySubscription = () => {
  const { colorScheme } = useColorScheme();
  const [activeTab, setActiveTab] = useState('current');
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [cancelling, setCancelling] = useState<string>('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await orderService.getUserSubscriptions();
      
      if (response.success && response.data) {
        setSubscriptions(response.data.subscriptions);
      } else {
        setError('Failed to load subscriptions');
      }
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel this subscription? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(subscriptionId);
              const response = await orderService.cancelSubscription(subscriptionId, 'User requested cancellation');
              
              if (response.success) {
                Alert.alert('Success', 'Subscription cancelled successfully');
                fetchSubscriptions(); // Refresh the list
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel subscription');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel subscription');
              console.error('Error cancelling subscription:', err);
            } finally {
              setCancelling('');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      case 'expired':
        return 'bg-gray-500';
      case 'paused':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getCurrentSubscriptions = () => {
    return subscriptions.filter(sub => 
      sub.status === 'active' || sub.status === 'pending'
    );
  };

  const getPastSubscriptions = () => {
    return subscriptions.filter(sub => 
      sub.status === 'completed' || sub.status === 'cancelled' || sub.status === 'expired'
    );
  };

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
              My Subscriptions
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            <Text className="mt-4 text-base text-zinc-500 dark:text-zinc-400">Loading subscriptions...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Feather name="alert-circle" size={48} color={colorScheme === 'dark' ? '#EF4444' : '#DC2626'} />
            <Text className="mt-4 text-center text-lg font-medium text-zinc-600 dark:text-zinc-300">
              {error}
            </Text>
            <TouchableOpacity 
              onPress={fetchSubscriptions}
              className="mt-4 rounded-xl bg-black px-6 py-3 dark:bg-white"
            >
              <Text className="text-white font-medium dark:text-black">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
              getCurrentSubscriptions().length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                  <Feather name="file-text" size={48} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                  <Text className="mt-4 text-center text-lg font-medium text-zinc-600 dark:text-zinc-300">
                    No active subscriptions
                  </Text>
                  <Text className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Subscribe to a meal plan to get started
                  </Text>
                  <TouchableOpacity 
                    onPress={() => router.push('/vendor-food')}
                    className="mt-4 rounded-xl bg-black px-6 py-3 dark:bg-white"
                  >
                    <Text className="text-white font-medium dark:text-black">Browse Plans</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="space-y-4">
                  {getCurrentSubscriptions().map((subscription) => (
                    <View
                      key={subscription._id}
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
                          {subscription.subscription?.planName || 'Subscription Plan'}
                        </Text>
                        <View className={`rounded-md px-3 py-1 ${getStatusColor(subscription.status)}`}>
                          <Text
                            className="text-xs font-medium text-white"
                            style={{ fontFamily: 'Poppins_500Medium' }}>
                            {getStatusText(subscription.status)}
                          </Text>
                        </View>
                      </View>

                      {/* Benefits */}
                      <View className="mb-4 space-y-2">
                        {subscription.subscription?.features?.map((feature, index) => (
                          <View key={index} className="flex-row items-center">
                            <View className="mr-3 h-2 w-2 rounded-full bg-gray-400" />
                            <Text
                              className="text-sm text-gray-600 dark:text-gray-300"
                              style={{ fontFamily: 'Poppins_400Regular' }}>
                              {feature}
                            </Text>
                          </View>
                        ))}
                        <View className="flex-row items-center">
                          <View className="mr-3 h-2 w-2 rounded-full bg-gray-400" />
                          <Text
                            className="text-sm text-gray-600 dark:text-gray-300"
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {subscription.creditsGranted} Meals Total
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <View className="mr-3 h-2 w-2 rounded-full bg-green-500" />
                          <Text
                            className="text-sm text-green-600 dark:text-green-400"
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {subscription.creditsGranted - subscription.creditsUsed} Meals Remaining
                          </Text>
                        </View>
                      </View>

                      {/* Price */}
                      <View className="mb-4 items-end">
                        {subscription.discountApplied > 0 && (
                          <Text
                            className="text-sm text-gray-500 line-through dark:text-gray-400"
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {formatCurrency(subscription.originalPrice)}
                          </Text>
                        )}
                        <Text
                          className="text-2xl font-semibold text-lime-600 dark:text-lime-400"
                          style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {formatCurrency(subscription.finalPrice)}
                        </Text>
                        <Text
                          className="text-sm text-gray-600 dark:text-gray-300"
                          style={{ fontFamily: 'Poppins_400Regular' }}>
                          {subscription.subscription?.duration || 'Custom'}
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
                          {formatDate(subscription.startDate)} to {formatDate(subscription.endDate)}
                        </Text>
                      </View>

                      {/* Meal Timings */}
                      <View className="mb-6 rounded-lg bg-white p-4 dark:bg-zinc-800">
                        <Text
                          className="mb-2 text-sm font-medium text-black dark:text-white"
                          style={{ fontFamily: 'Poppins_500Medium' }}>
                          Delivery Schedule
                        </Text>
                        {subscription.mealTiming.lunch.enabled && (
                          <View className="flex-row items-center mb-1">
                            <Feather name="sun" size={14} color="#F59E0B" />
                            <Text
                              className="ml-2 text-sm text-gray-600 dark:text-gray-300"
                              style={{ fontFamily: 'Poppins_400Regular' }}>
                              Lunch: {subscription.mealTiming.lunch.time}
                            </Text>
                          </View>
                        )}
                        {subscription.mealTiming.dinner.enabled && (
                          <View className="flex-row items-center">
                            <Feather name="moon" size={14} color="#6366F1" />
                            <Text
                              className="ml-2 text-sm text-gray-600 dark:text-gray-300"
                              style={{ fontFamily: 'Poppins_400Regular' }}>
                              Dinner: {subscription.mealTiming.dinner.time}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Cancel Button */}
                      {subscription.status === 'active' && (
                        <TouchableOpacity 
                          onPress={() => handleCancelSubscription(subscription._id)}
                          disabled={cancelling === subscription._id}
                          className="rounded-lg bg-red-500 py-4">
                          {cancelling === subscription._id ? (
                            <View className="flex-row items-center justify-center">
                              <ActivityIndicator size="small" color="#FFFFFF" />
                              <Text
                                className="ml-2 text-center text-base font-medium text-white"
                                style={{ fontFamily: 'Poppins_500Medium' }}>
                                Cancelling...
                              </Text>
                            </View>
                          ) : (
                            <Text
                              className="text-center text-base font-medium text-white"
                              style={{ fontFamily: 'Poppins_500Medium' }}>
                              Cancel Subscription
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )
            ) : (
              getPastSubscriptions().length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                  <Feather name="clock" size={48} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                  <Text className="mt-4 text-center text-lg font-medium text-zinc-600 dark:text-zinc-300">
                    No past subscriptions
                  </Text>
                  <Text className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Your completed subscriptions will appear here
                  </Text>
                </View>
              ) : (
                <View className="space-y-4">
                  {getPastSubscriptions().map((subscription) => (
                    <View
                      key={subscription._id}
                      className={`mb-2 rounded-xl border p-6 ${
                        colorScheme === 'dark'
                          ? 'border-gray-600 bg-neutral-800'
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                      {/* Header */}
                      <View className="mb-4 flex-row items-center justify-between">
                        <Text
                          className="text-xl font-semibold text-black dark:text-white"
                          style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {subscription.subscription?.planName || 'Subscription Plan'}
                        </Text>
                        <View className={`rounded-md px-3 py-1 ${getStatusColor(subscription.status)}`}>
                          <Text
                            className="text-xs font-medium text-white"
                            style={{ fontFamily: 'Poppins_500Medium' }}>
                            {getStatusText(subscription.status)}
                          </Text>
                        </View>
                      </View>

                      {/* Benefits */}
                      <View className="mb-4 space-y-2">
                        {subscription.subscription?.features?.map((feature, index) => (
                          <View key={index} className="flex-row items-center">
                            <View className="mr-3 h-2 w-2 rounded-full bg-gray-400" />
                            <Text
                              className="text-sm text-gray-600 dark:text-gray-300"
                              style={{ fontFamily: 'Poppins_400Regular' }}>
                              {feature}
                            </Text>
                          </View>
                        ))}
                        <View className="flex-row items-center">
                          <View className="mr-3 h-2 w-2 rounded-full bg-gray-400" />
                          <Text
                            className="text-sm text-gray-600 dark:text-gray-300"
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {subscription.creditsGranted} Total Meals
                          </Text>
                        </View>
                      </View>

                      {/* Price */}
                      <View className="mb-4 items-end">
                        {subscription.discountApplied > 0 && (
                          <Text
                            className="text-sm text-gray-500 line-through dark:text-gray-400"
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {formatCurrency(subscription.originalPrice)}
                          </Text>
                        )}
                        <Text
                          className="text-2xl font-semibold text-lime-600 dark:text-lime-400"
                          style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {formatCurrency(subscription.finalPrice)}
                        </Text>
                        <Text
                          className="text-sm text-gray-600 dark:text-gray-300"
                          style={{ fontFamily: 'Poppins_400Regular' }}>
                          {subscription.subscription?.duration || 'Custom'}
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
                          {formatDate(subscription.startDate)} to {formatDate(subscription.endDate)}
                        </Text>
                      </View>

                      {/* Renew Button */}
                      <TouchableOpacity 
                        onPress={() => router.push('/vendor-food')}
                        className="rounded-lg bg-black py-4 dark:bg-white">
                        <Text
                          className="text-center text-base font-medium text-white dark:text-black"
                          style={{ fontFamily: 'Poppins_500Medium' }}>
                          Renew Subscription
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )
            )}

            {/* Bottom Spacing */}
            <View className="h-20" />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default MySubscription;