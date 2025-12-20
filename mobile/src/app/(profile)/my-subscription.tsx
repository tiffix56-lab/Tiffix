import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { subscriptionService } from '@/services/subscription.service';
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
    console.log('🚀 [MY_SUBSCRIPTION] Starting fetchSubscriptions...');
    
    try {
      setLoading(true);
      console.log('📊 [MY_SUBSCRIPTION] Loading state set to true');
      
      const response = await subscriptionService.getUserSubscriptions();
      console.log('📡 [MY_SUBSCRIPTION] Subscription service response received:', response);
      
      if (response.success && response.data) {
        const subscriptions = response.data.subscriptions;
        console.log('✅ [MY_SUBSCRIPTION] Successfully received subscriptions:', {
          count: subscriptions.length,
          subscriptions: subscriptions
        });
        setSubscriptions(subscriptions);
      } else {
        console.log('❌ [MY_SUBSCRIPTION] Failed to get subscriptions:', {
          success: response.success,
          data: response.data,
          message: response.message,
          error: response.error
        });
        
        // Set specific error messages based on error type
        let errorMsg = 'Failed to load subscriptions';
        
        if (response.error?.code === 'AUTH_ERROR') {
          errorMsg = 'Authentication failed. Please login again.';
        } else if (response.error?.code === 'NETWORK_ERROR') {
          errorMsg = 'Network error. Please check your internet connection and try again.';
        } else if (response.message) {
          errorMsg = response.message;
        }
        
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Failed to load subscriptions';
      console.error('❌ [MY_SUBSCRIPTION] Exception in fetchSubscriptions:', err);
      console.error('❌ [MY_SUBSCRIPTION] Exception details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      setError(errorMsg);
    } finally {
      console.log('📊 [MY_SUBSCRIPTION] Setting loading to false');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel this subscription? This action cannot be undone and there will be no refund.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(subscriptionId);
              console.log('🚀 [MY_SUBSCRIPTION] Starting subscription cancellation:', subscriptionId);
              
              const response = await subscriptionService.cancelUserSubscription(
                subscriptionId, 
                'User requested cancellation'
              );
              
              console.log('📡 [MY_SUBSCRIPTION] Cancellation response:', response);
              
              if (response.success) {
                Alert.alert('Success', 'Subscription cancelled successfully', [
                  { text: 'OK', onPress: () => fetchSubscriptions() }
                ]);
              } else {
                Alert.alert('Cancellation Failed', response.message || 'Failed to cancel subscription. Please try again.');
              }
            } catch (err) {
              console.error('❌ [MY_SUBSCRIPTION] Error cancelling subscription:', err);
              Alert.alert('Error', 'Failed to cancel subscription. Please check your internet connection and try again.');
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
    console.log('🔍 [MY_SUBSCRIPTION] Filtering current subscriptions from:', subscriptions);
    
    const currentSubs = subscriptions.filter(sub => {
      console.log('🔍 [MY_SUBSCRIPTION] Checking subscription:', {
        id: sub._id,
        status: sub.status,
        analytics: sub.analytics
      });
      
      // Use analytics data if available, otherwise fallback to status
      if (sub.analytics?.isActive !== undefined) {
        const isCurrentAnalytics = sub.analytics.isActive && !sub.analytics.isExpired;
        console.log('🔍 [MY_SUBSCRIPTION] Using analytics - isCurrent:', isCurrentAnalytics);
        return isCurrentAnalytics;
      }
      
      const isCurrentStatus = sub.status === 'active' || sub.status === 'pending';
      console.log('🔍 [MY_SUBSCRIPTION] Using status - isCurrent:', isCurrentStatus);
      return isCurrentStatus;
    });
    
    console.log('✅ [MY_SUBSCRIPTION] Current subscriptions:', {
      count: currentSubs.length,
      subscriptions: currentSubs
    });
    
    return currentSubs;
  };

  const getPastSubscriptions = () => {
    console.log('🔍 [MY_SUBSCRIPTION] Filtering past subscriptions from:', subscriptions);
    
    const pastSubs = subscriptions.filter(sub => {
      console.log('🔍 [MY_SUBSCRIPTION] Checking subscription for past:', {
        id: sub._id,
        status: sub.status,
        analytics: sub.analytics
      });
      
      // Use analytics data if available, otherwise fallback to status
      if (sub.analytics?.isExpired !== undefined) {
        const isPastAnalytics = sub.analytics.isExpired || sub.status === 'completed' || sub.status === 'cancelled';
        console.log('🔍 [MY_SUBSCRIPTION] Using analytics - isPast:', isPastAnalytics);
        return isPastAnalytics;
      }
      
      const isPastStatus = sub.status === 'completed' || sub.status === 'cancelled' || sub.status === 'expired';
      console.log('🔍 [MY_SUBSCRIPTION] Using status - isPast:', isPastStatus);
      return isPastStatus;
    });
    
    console.log('✅ [MY_SUBSCRIPTION] Past subscriptions:', {
      count: pastSubs.length,
      subscriptions: pastSubs
    });
    
    return pastSubs;
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
                    <View key={subscription._id} className="mb-6 rounded-xl bg-white shadow-sm dark:bg-neutral-800">
                      <View className="flex-row overflow-hidden">
                        {/* Subscription Image */}
                        <View className="mr-4">
                          <Image 
                            source={require('@/assets/category-2.png')} 
                            className="h-52 w-36 rounded-lg" 
                            resizeMode="cover" 
                          />
                        </View>

                        {/* Subscription Details */}
                        <View className="flex-1 p-4">
                          {/* Header */}
                          <View className="flex-row items-start justify-between mb-3">
                            <Text
                              className="flex-1 text-xl font-semibold text-black dark:text-white mr-3"
                              style={{ fontFamily: 'Poppins_600SemiBold' }}>
                              {subscription.subscriptionId?.planName || 'Subscription Plan'}
                            </Text>
                            <View className={`rounded-md border px-2 py-1 ${
                              subscription.status === 'active' 
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                : 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                            }`}>
                              <Text
                                className={`text-xs font-medium ${
                                  subscription.status === 'active' 
                                    ? 'text-green-700 dark:text-green-400' 
                                    : 'text-gray-700 dark:text-gray-400'
                                }`}
                                style={{ fontFamily: 'Poppins_500Medium' }}>
                                {getStatusText(subscription.status)}
                              </Text>
                            </View>
                          </View>

                          {/* Duration and Category */}
                          <Text
                            className="mb-3 text-sm text-gray-600 dark:text-gray-300"
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {subscription.subscriptionId?.category?.replace('_', ' ').toUpperCase() || 'SUBSCRIPTION'} • {subscription.subscriptionId?.durationDays || 0} days
                          </Text>

                          {/* Date Range */}
                          <View className="mb-3">
                            <View className="flex-row items-center">
                              <Feather
                                name="calendar"
                                size={16}
                                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                              />
                              <Text
                                className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                                {subscription.formattedDates?.startDate || 'Start Date'} - {subscription.formattedDates?.endDate || 'End Date'}
                              </Text>
                            </View>
                            {subscription.analytics?.remainingDays !== undefined && subscription.analytics.remainingDays > 0 && (
                              <View className="flex-row items-center mt-1">
                                <Feather
                                  name="clock"
                                  size={16}
                                  color={colorScheme === 'dark' ? '#3B82F6' : '#2563EB'}
                                />
                                <Text
                                  className="ml-2 text-sm text-blue-600 dark:text-blue-400"
                                  style={{ fontFamily: 'Poppins_500Medium' }}>
                                  {subscription.analytics.remainingDays} Days Left
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Credits Info */}
                          <View className="mb-3">
                            <Text
                              className="text-sm text-gray-600 dark:text-gray-300"
                              style={{ fontFamily: 'Poppins_400Regular' }}>
                              Credits: {subscription.analytics?.remainingCredits || (subscription.creditsGranted - subscription.creditsUsed)}/{subscription.creditsGranted} • {formatCurrency(subscription.subscriptionId?.discountedPrice || subscription.finalPrice)}
                            </Text>
                          </View>

                          {/* Progress Bar */}
                          {subscription.analytics && (
                            <View className="mb-4">
                              <View className="mb-2 flex-row items-center justify-between">
                                <Text
                                  className="text-xs text-gray-600 dark:text-gray-400"
                                  style={{ fontFamily: 'Poppins_400Regular' }}>
                                  Meals Used
                                </Text>
                                <Text
                                  className="text-xs text-gray-600 dark:text-gray-400"
                                  style={{ fontFamily: 'Poppins_500Medium' }}>
                                  {Math.round(subscription.analytics.creditsUsedPercentage)}%
                                </Text>
                              </View>
                              <View className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                                <View 
                                  className="h-2 rounded-full bg-green-500"
                                  style={{ 
                                    width: `${Math.min(100, Math.max(0, subscription.analytics.creditsUsedPercentage))}%` 
                                  }}
                                />
                              </View>
                            </View>
                          )}

                          {/* Action Buttons */}
                          {subscription.analytics?.isActive ? (
                            <View className="flex-row gap-3">
                              <TouchableOpacity 
                                onPress={() => handleCancelSubscription(subscription._id)}
                                disabled={cancelling === subscription._id}
                                className="flex-1 rounded-lg bg-red-500 py-3">
                                {cancelling === subscription._id ? (
                                  <View className="flex-row items-center justify-center">
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text
                                      className="ml-2 text-center text-sm font-medium text-white"
                                      style={{ fontFamily: 'Poppins_500Medium' }}>
                                      Cancelling...
                                    </Text>
                                  </View>
                                ) : (
                                  <Text
                                    className="text-center text-sm font-medium text-white"
                                    style={{ fontFamily: 'Poppins_500Medium' }}>
                                    Cancel Plan
                                  </Text>
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => router.push(`/(tabs)/subscription?selectedSubscription=${subscription._id}`)}
                                className="flex-1 rounded-lg bg-black py-3 dark:bg-white">
                                <Text
                                  className="text-center text-sm font-medium text-white dark:text-black"
                                  style={{ fontFamily: 'Poppins_500Medium' }}>
                                  View Orders
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity 
                              onPress={() => router.push(`/(tabs)/subscription?selectedSubscription=${subscription._id}`)}
                              className="rounded-lg bg-black py-3 dark:bg-white">
                              <Text
                                className="text-center text-sm font-medium text-white dark:text-black"
                                style={{ fontFamily: 'Poppins_500Medium' }}>
                                View Orders
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
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
                    <View key={subscription._id} className="mb-6 rounded-xl bg-white shadow-sm dark:bg-neutral-800">
                      <View className="flex-row overflow-hidden">
                        {/* Subscription Image */}
                        <View className="mr-4">
                          <Image 
                            source={require('@/assets/category-2.png')} 
                            className="h-48 w-32 rounded-lg opacity-60" 
                            resizeMode="cover" 
                          />
                        </View>

                        {/* Subscription Details */}
                        <View className="flex-1 p-4">
                          {/* Header */}
                          <View className="flex-row items-start justify-between mb-3">
                            <Text
                              className="flex-1 text-xl font-semibold text-black dark:text-white mr-3"
                              style={{ fontFamily: 'Poppins_600SemiBold' }}>
                              {subscription.subscriptionId?.planName || 'Subscription Plan'}
                            </Text>
                            <View className={`rounded-md border px-2 py-1 ${
                              subscription.status === 'completed' 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                            }`}>
                              <Text
                                className={`text-xs font-medium ${
                                  subscription.status === 'completed' 
                                    ? 'text-blue-700 dark:text-blue-400' 
                                    : 'text-gray-700 dark:text-gray-400'
                                }`}
                                style={{ fontFamily: 'Poppins_500Medium' }}>
                                {getStatusText(subscription.status)}
                              </Text>
                            </View>
                          </View>

                          {/* Duration and Category */}
                          <Text
                            className="mb-3 text-sm text-gray-600 dark:text-gray-300"
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {subscription.subscriptionId?.category?.replace('_', ' ').toUpperCase() || 'SUBSCRIPTION'} • {subscription.subscriptionId?.durationDays || 0} days
                          </Text>

                          {/* Date Range */}
                          <View className="mb-3">
                            <View className="flex-row items-center">
                              <Feather
                                name="calendar"
                                size={16}
                                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                              />
                              <Text
                                className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                                {subscription.formattedDates?.startDate || 'Start Date'} - {subscription.formattedDates?.endDate || 'End Date'}
                              </Text>
                            </View>
                          </View>

                          {/* Total Meals Consumed */}
                          <View className="mb-3">
                            <Text
                              className="text-sm text-gray-600 dark:text-gray-300"
                              style={{ fontFamily: 'Poppins_400Regular' }}>
                              Total Meals: {subscription.creditsUsed}/{subscription.creditsGranted} • {formatCurrency(subscription.subscriptionId?.discountedPrice || subscription.finalPrice)}
                            </Text>
                          </View>

                          {/* Action Button */}
                          <TouchableOpacity 
                            onPress={() => router.push('/(home)/vendor-food')}
                            className="rounded-lg bg-black py-3 dark:bg-white">
                            <Text
                              className="text-center text-sm font-medium text-white dark:text-black"
                              style={{ fontFamily: 'Poppins_500Medium' }}>
                              Subscribe Again
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
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