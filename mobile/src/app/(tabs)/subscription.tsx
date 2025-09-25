import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { subscriptionService } from '@/services/subscription.service';
import { orderService } from '@/services/order.service';
import { reviewService } from '@/services/review.service';

const { width } = Dimensions.get('window');

interface UserSubscription {
  _id: string;
  userId: string;
  subscriptionId: {
    _id: string;
    planName: string;
    category: string;
    description: string;
    originalPrice: number;
    discountedPrice: number;
    durationDays: number;
  };
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  remainingCredits: number;
  totalCredits: number;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  mealTiming: {
    lunch: {
      enabled: boolean;
      time: string;
    };
    dinner: {
      enabled: boolean;
      time: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  subscriptionId: string;
  menuId: string;
  vendorId: string;
  userId: string;
  orderDate: string;
  deliveryTime: string;
  status: 'pending' | 'confirmed' | 'prepared' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'skipped';
  mealType: 'lunch' | 'dinner';
  menu?: {
    name: string;
    description: string;
    image: string;
    isVegetarian: boolean;
  };
  skipCount?: string;
  canSkip: boolean;
  canCancel: boolean;
  createdAt: string;
}

interface SubscriptionCardProps {
  subscription: UserSubscription;
  isActive?: boolean;
  onCancel: (subscriptionId: string) => void;
  onViewOrders: (subscriptionId: string) => void;
  onSwitch: (subscriptionId: string) => void;
}

interface OrderCardProps {
  order: Order;
  isUpcoming?: boolean;
  onSkip: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onReview: (orderId: string) => void;
}

const Subscription = () => {
  const { colorScheme } = useColorScheme();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('🚀 [SUBSCRIPTION_TAB] Starting fetchData...');
    
    try {
      setLoading(true);
      console.log('📊 [SUBSCRIPTION_TAB] Loading state set to true');
      
      // Fetch subscriptions only (like profile page)
      console.log('📡 [SUBSCRIPTION_TAB] Fetching subscriptions...');
      const response = await subscriptionService.getUserSubscriptions();
      console.log('📡 [SUBSCRIPTION_TAB] Subscription service response received:', response);
      
      if (response.success && response.data) {
        const subscriptions = response.data.subscriptions || [];
        console.log('✅ [SUBSCRIPTION_TAB] Successfully received subscriptions:', {
          count: subscriptions.length,
          subscriptions: subscriptions
        });
        setSubscriptions(subscriptions);
        
        // Now fetch orders if subscriptions were loaded successfully
        if (subscriptions.length > 0) {
          console.log('📡 [SUBSCRIPTION_TAB] Fetching orders...');
          try {
            // Try to get more comprehensive order data
            const ordersResponse = await orderService.getUserOrders({
              page: 1,
              limit: 100, // Get more orders
              days: 90    // Get orders from last 90 days
            });
            console.log('📡 [SUBSCRIPTION_TAB] Orders response:', ordersResponse);
            
            if (ordersResponse.success && ordersResponse.data) {
              const ordersList = ordersResponse.data.orders || [];
              console.log('✅ [SUBSCRIPTION_TAB] Setting orders:', {
                count: ordersList.length,
                orders: ordersList
              });
              
              // Log first order for debugging structure
              if (ordersList.length > 0) {
                console.log('🔍 [SUBSCRIPTION_TAB] Sample order structure:', ordersList[0]);
              }
              
              setOrders(ordersList);
              
              // Auto-select first active subscription for orders display
              if (!selectedSubscriptionId && subscriptions.length > 0) {
                const activeSubscription = subscriptions.find(sub => sub.status === 'active') || subscriptions[0];
                setSelectedSubscriptionId(activeSubscription._id);
                console.log('🎯 [SUBSCRIPTION_TAB] Auto-selected subscription for orders:', activeSubscription._id);
              }
            } else {
              console.log('❌ [SUBSCRIPTION_TAB] Orders fetch failed:', ordersResponse.message);
              setOrders([]);
            }
          } catch (orderError) {
            console.error('❌ [SUBSCRIPTION_TAB] Orders fetch error:', orderError);
            setOrders([]);
          }
        }
      } else {
        console.log('❌ [SUBSCRIPTION_TAB] Failed to get subscriptions:', {
          success: response.success,
          data: response.data,
          message: response.message,
          error: response.error
        });
        
        // Handle specific error cases (same as profile page)
        if (response.error?.code === 'AUTH_ERROR') {
          console.log('🔐 [SUBSCRIPTION_TAB] Authentication error - user needs to login');
        } else if (response.error?.code === 'NETWORK_ERROR') {
          console.log('🌐 [SUBSCRIPTION_TAB] Network error - show network error message');
        }
        
        setOrders([]); // Clear orders if subscriptions failed
      }
      
    } catch (error) {
      console.error('❌ [SUBSCRIPTION_TAB] Exception in fetchData:', error);
      console.error('❌ [SUBSCRIPTION_TAB] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    } finally {
      console.log('📊 [SUBSCRIPTION_TAB] Setting loading to false and refreshing to false');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSkipOrder = async (orderId: string) => {
    Alert.alert(
      'Skip Order',
      'Are you sure you want to skip this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await orderService.skipOrder(orderId, 'User requested skip');
              if (response.success) {
                Alert.alert('Success', 'Order skipped successfully');
                fetchData();
              } else {
                Alert.alert('Error', response.message || 'Failed to skip order');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to skip order');
            }
          },
        },
      ]
    );
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await orderService.cancelOrder(orderId, 'User requested cancellation');
              if (response.success) {
                Alert.alert('Success', 'Order cancelled successfully');
                fetchData();
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel order');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  const handleReviewOrder = async (orderId: string) => {
    // Navigate to review screen or show review modal
    router.push(`/(profile)/review?orderId=${orderId}`);
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
              const response = await subscriptionService.cancelUserSubscription(
                subscriptionId, 
                'User requested cancellation'
              );
              if (response.success) {
                Alert.alert('Success', 'Subscription cancelled successfully');
                fetchData();
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel subscription');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
              console.error('Error cancelling subscription:', error);
            }
          },
        },
      ]
    );
  };

  const handleViewOrders = async (subscriptionId: string) => {
    console.log('📋 [SUBSCRIPTION_TAB] View orders clicked for subscription:', subscriptionId);
    setSelectedSubscriptionId(subscriptionId);
    setActiveTab('orders');
    
    // Fetch orders specifically for this subscription
    try {
      const ordersResponse = await orderService.getUserOrders({
        page: 1,
        limit: 100,
        days: 90
      });
      
      if (ordersResponse.success && ordersResponse.data) {
        const allOrders = ordersResponse.data.orders || [];
        console.log('📦 [SUBSCRIPTION_TAB] All orders for filtering:', allOrders.length);
        
        // Filter orders by the selected subscription with multiple field checks
        const filteredOrders = allOrders.filter(order => {
          const matches = order.subscriptionId === subscriptionId || 
                         order.subscription?._id === subscriptionId ||
                         order.userSubscriptionId === subscriptionId ||
                         order.userSubscription?._id === subscriptionId ||
                         order.subscription === subscriptionId;
          
          if (matches) {
            console.log('✅ [SUBSCRIPTION_TAB] Order matches subscription:', order._id);
          }
          
          return matches;
        });
        
        console.log('🎯 [SUBSCRIPTION_TAB] Filtered orders for subscription:', filteredOrders.length);
        setOrders(filteredOrders);
        
        // If no filtered orders found, show debug info
        if (filteredOrders.length === 0) {
          console.log('🔍 [SUBSCRIPTION_TAB] No orders found for subscription:', subscriptionId);
          if (allOrders.length > 0) {
            console.log('🔍 [SUBSCRIPTION_TAB] Sample order fields:', Object.keys(allOrders[0]));
            console.log('🔍 [SUBSCRIPTION_TAB] Sample order:', allOrders[0]);
          }
          // For debugging, show all orders if none are filtered
          setOrders(allOrders);
        }
      } else {
        console.log('❌ [SUBSCRIPTION_TAB] Failed to fetch orders:', ordersResponse.message);
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ [SUBSCRIPTION_TAB] Error fetching orders:', error);
      setOrders([]);
    }
  };

  const handleSwitchVendor = (subscriptionId: string) => {
    Alert.alert(
      'Switch Vendor',
      'Do you want to switch between vendor food and home chef for this subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch to Home Chef',
          onPress: () => requestVendorSwitch(subscriptionId, 'home_chef')
        },
        {
          text: 'Switch to Vendor Food', 
          onPress: () => requestVendorSwitch(subscriptionId, 'food_vendor')
        }
      ]
    );
  };

  const requestVendorSwitch = async (subscriptionId: string, targetCategory: string) => {
    try {
      console.log('🔄 [SUBSCRIPTION_TAB] Requesting vendor switch:', { subscriptionId, targetCategory });
      
      const response = await subscriptionService.requestVendorSwitch(
        subscriptionId, 
        `User requested switch to ${targetCategory.replace('_', ' ')}`
      );
      
      if (response.success) {
        Alert.alert(
          'Switch Request Submitted', 
          'Your vendor switch request has been submitted. You will be notified once it is processed.',
          [{ text: 'OK', onPress: () => fetchData() }]
        );
      } else {
        Alert.alert('Switch Request Failed', response.message || 'Failed to submit switch request. Please try again.');
      }
    } catch (error) {
      console.error('❌ [SUBSCRIPTION_TAB] Error requesting vendor switch:', error);
      Alert.alert('Error', 'Failed to submit switch request. Please try again.');
    }
  };

  console.log('🔍 [SUBSCRIPTION_TAB] Starting data filtering...');
  console.log('🔍 [SUBSCRIPTION_TAB] Raw subscriptions data:', subscriptions);
  console.log('🔍 [SUBSCRIPTION_TAB] Raw orders data:', orders);
  console.log('🔍 [SUBSCRIPTION_TAB] Selected subscription ID:', selectedSubscriptionId);

  // Use same filtering logic as profile page
  const getCurrentSubscriptions = () => {
    return subscriptions.filter(sub => {
      // Use analytics data if available, otherwise fallback to status
      if (sub.analytics?.isActive !== undefined) {
        return sub.analytics.isActive && !sub.analytics.isExpired;
      }
      return sub.status === 'active' || sub.status === 'pending';
    });
  };

  const getPastSubscriptions = () => {
    return subscriptions.filter(sub => {
      // Use analytics data if available, otherwise fallback to status
      if (sub.analytics?.isExpired !== undefined) {
        return sub.analytics.isExpired || sub.status === 'completed' || sub.status === 'cancelled';
      }
      return sub.status === 'completed' || sub.status === 'cancelled' || sub.status === 'expired';
    });
  };

  const upcomingSubscriptions = getCurrentSubscriptions();
  const pastSubscriptions = getPastSubscriptions();
  
  console.log('🔍 [SUBSCRIPTION_TAB] Filtered subscriptions:', {
    upcoming: upcomingSubscriptions.length,
    past: pastSubscriptions.length,
    upcomingItems: upcomingSubscriptions,
    pastItems: pastSubscriptions
  });
  
  // Filter orders by selected subscription
  const subscriptionOrders = selectedSubscriptionId 
    ? orders.filter(order => {
        console.log(`🔍 [SUBSCRIPTION_TAB] Filtering order ${order._id}: subscriptionId=${order.subscriptionId}, selectedId=${selectedSubscriptionId}, match=${order.subscriptionId === selectedSubscriptionId}`);
        return order.subscriptionId === selectedSubscriptionId;
      })
    : orders;
    
  console.log('🔍 [SUBSCRIPTION_TAB] Order filtering results:', {
    totalOrders: orders.length,
    selectedSubscriptionId: selectedSubscriptionId,
    filteredOrders: subscriptionOrders.length,
    filteredOrdersList: subscriptionOrders
  });
    
  const upcomingOrders = subscriptionOrders.filter(order => {
    const isUpcoming = ['pending', 'confirmed', 'prepared', 'out_for_delivery'].includes(order.status);
    console.log(`🔍 [SUBSCRIPTION_TAB] Order ${order._id} status: ${order.status}, isUpcoming: ${isUpcoming}`);
    return isUpcoming;
  });
  
  const deliveredOrders = subscriptionOrders.filter(order => 
    ['delivered'].includes(order.status)
  );
  
  console.log('🔍 [SUBSCRIPTION_TAB] Final order counts:', {
    upcoming: upcomingOrders.length,
    delivered: deliveredOrders.length,
    upcomingOrdersList: upcomingOrders,
    deliveredOrdersList: deliveredOrders
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, isActive = false, onCancel, onViewOrders, onSwitch }) => (
    <View className="mb-6 rounded-md bg-white shadow-sm dark:bg-neutral-800">
      <View className="flex-row overflow-hidden">
        {/* Subscription Image - Full Height */}
        <View className="mr-2">
          <Image 
            source={require('@/assets/category-2.png')} 
            className="h-52 w-36 rounded-lg" 
            resizeMode="cover" 
          />
        </View>

        {/* Subscription Details */}
        <View className="flex-1 p-2">
          <View className="flex-row items-center justify-between">
            <Text
              className="mb-1 flex-1 text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {subscription.subscriptionId.planName}
            </Text>
            <View className={`mb-4 rounded-md border px-2 py-1 ${
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
                {subscription.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text
            className="mb-4 text-sm text-gray-600 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            {subscription.subscriptionId.category.replace('_', ' ').toUpperCase()} • {subscription.subscriptionId.durationDays} days
          </Text>

          <View className="mb-4">
            <View className="flex-row items-center">
              <Feather
                name="calendar"
                size={16}
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
              />
              <Text
                className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Valid until {formatDate(subscription.endDate)}
              </Text>
            </View>

            {isActive && (
              <TouchableOpacity 
                className="flex-row items-center mt-2"
                onPress={() => onSwitch(subscription._id)}>
                <Feather
                  name="refresh-cw"
                  size={16}
                  color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Switch
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Credits Info */}
          <View className="mb-4">
            <Text
              className="text-sm text-gray-600 dark:text-gray-300"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              Credits: {(subscription.creditsGranted - subscription.creditsUsed) ?? 'N/A'}/{subscription.creditsGranted ?? 'N/A'} • {formatCurrency(subscription.subscriptionId.discountedPrice)}
            </Text>
          </View>

          {/* Action Buttons */}
          {isActive ? (
            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 rounded-lg bg-red-500 py-4"
                onPress={() => onCancel(subscription._id)}>
                <Text
                  className="text-center text-sm font-medium text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel Plan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 rounded-lg bg-black py-4 dark:bg-white"
                onPress={() => onViewOrders(subscription._id)}>
                <Text
                  className="text-center text-base font-medium text-white dark:text-black"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  View Orders
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TouchableOpacity 
                className="rounded-lg bg-black py-4 dark:bg-white"
                onPress={() => onViewOrders(subscription._id)}>
                <Text
                  className="text-center text-base font-medium text-white dark:text-black"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  View Details
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const OrderCard: React.FC<OrderCardProps> = ({ order, isUpcoming = false, onSkip, onCancel, onReview }) => (
    <View className="mb-6 rounded-md bg-white shadow-sm dark:bg-neutral-800">
      <View className="flex-row overflow-hidden ">
        {/* Meal Image - Full Height */}
        <View className="mr-2">
          <Image 
            source={order.menu?.image ? { uri: order.menu.image } : require('@/assets/category-2.png')} 
            className="h-52 w-36 rounded-lg" 
            resizeMode="cover" 
          />
        </View>

        {/* Meal Details */}
        <View className="flex-1 p-2">
          <View className=" flex-row items-center justify-between">
            <Text
              className="mb-1 flex-1 text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {order.menu?.name || 'Meal'}
            </Text>
            {order.menu?.isVegetarian && (
              <View className="mb-4 rounded-md border border-lime-500 bg-lime-50 px-2 py-1 dark:bg-lime-900/20">
                <Text
                  className="mb-1 text-xs font-medium text-lime-700 dark:text-lime-400"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  VEG
                </Text>
              </View>
            )}
          </View>

          <Text
            className="mb-4 text-sm text-gray-600 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            {order.menu?.description || 'No description available'}
          </Text>

          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather
                name="clock"
                size={16}
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
              />
              <Text
                className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {order.mealType.toUpperCase()} • {new Date(order.deliveryDate).toLocaleDateString()} at {order.deliveryTime}
              </Text>
            </View>

            {isUpcoming && (
              <TouchableOpacity className="flex-row items-center">
                <Feather
                  name="refresh-cw"
                  size={16}
                  color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Switch
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          {isUpcoming ? (
            <View className="flex-row gap-3">
              {order.canCancel && (
                <TouchableOpacity 
                  className="flex-1 rounded-lg bg-red-500 py-4"
                  onPress={() => onCancel(order._id)}>
                  <Text
                    className="text-center text-sm font-medium text-white"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Cancel Meal
                  </Text>
                </TouchableOpacity>
              )}
              {order.canSkip && (
                <TouchableOpacity 
                  className="flex-1 rounded-lg bg-black py-4 dark:bg-white"
                  onPress={() => onSkip(order._id)}>
                  <Text
                    className="text-center text-base font-medium text-white dark:text-black"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    {order.skipCount || 'Skip'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              <TouchableOpacity 
                className="rounded-lg bg-black py-4 dark:bg-white"
                onPress={() => onReview(order._id)}>
                <Text
                  className="text-center text-base font-medium text-white dark:text-black"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Review Us
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

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
                {activeTab === 'orders' ? (
                  // Show back button and orders title when viewing orders
                  <View className="flex-1 flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity 
                      onPress={() => {
                        setActiveTab('upcoming');
                        setSelectedSubscriptionId(null);
                      }}
                      className="flex-row items-center">
                      <Feather name="arrow-left" size={16} color={colorScheme === 'dark' ? '#000' : '#666'} />
                      <Text className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Back</Text>
                    </TouchableOpacity>
                    <Text className="text-base font-semibold text-black dark:text-white">Orders</Text>
                    <View className="w-12" />
                  </View>
                ) : (
                  <>
                    {/* Custom indicator */}
                    <View
                      className="absolute rounded-full bg-white shadow-sm dark:bg-black"
                      style={{
                        height: 42,
                        width: '50%',
                        left: activeTab === 'upcoming' ? '0%' : '50%',
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
                      onPress={() => setActiveTab('upcoming')}
                      activeOpacity={0.8}
                      style={{ zIndex: 2 }}>
                      <Text
                        className={`text-center text-base font-semibold ${
                          activeTab === 'upcoming'
                            ? 'text-black dark:text-white'
                            : 'text-gray-600 dark:text-gray-900'
                        }`}
                        style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Upcoming
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 rounded-full px-6 py-3"
                      onPress={() => setActiveTab('delivered')}
                      activeOpacity={0.8}
                      style={{ zIndex: 2 }}>
                      <Text
                        className={`text-center text-base font-semibold ${
                          activeTab === 'delivered'
                            ? 'text-black dark:text-white'
                            : 'text-gray-600 dark:text-gray-900'
                        }`}
                        style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Delivered
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              <Text className="mt-4 text-gray-600 dark:text-gray-300">Loading subscriptions...</Text>
            </View>
          ) : activeTab === 'orders' ? (
            <View>
              <Text className="mb-4 text-lg font-semibold text-black dark:text-white">Upcoming Orders</Text>
              {upcomingOrders.length > 0 ? (
                upcomingOrders.map((order) => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    isUpcoming={true} 
                    onSkip={handleSkipOrder}
                    onCancel={handleCancelOrder}
                    onReview={handleReviewOrder}
                  />
                ))
              ) : (
                <View className="py-10 items-center">
                  <Text className="text-gray-600 dark:text-gray-300">No upcoming orders for this subscription</Text>
                </View>
              )}
              
              <Text className="mb-4 mt-6 text-lg font-semibold text-black dark:text-white">Delivered Orders</Text>
              {deliveredOrders.length > 0 ? (
                deliveredOrders.map((order) => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    isUpcoming={false} 
                    onSkip={handleSkipOrder}
                    onCancel={handleCancelOrder}
                    onReview={handleReviewOrder}
                  />
                ))
              ) : (
                <View className="py-10 items-center">
                  <Text className="text-gray-600 dark:text-gray-300">No delivered orders for this subscription</Text>
                </View>
              )}
            </View>
          ) : activeTab === 'upcoming' ? (
            <View>
              {upcomingSubscriptions.length > 0 ? (
                upcomingSubscriptions.map((subscription) => (
                  <SubscriptionCard 
                    key={subscription._id} 
                    subscription={subscription} 
                    isActive={true} 
                    onCancel={handleCancelSubscription}
                    onViewOrders={handleViewOrders}
                    onSwitch={handleSwitchVendor}
                  />
                ))
              ) : (
                <View className="py-20 items-center px-6">
                  <Feather name="calendar" size={48} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                  <Text 
                    className="mt-4 text-center text-lg font-medium text-gray-600 dark:text-gray-300"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    No Active Subscriptions
                  </Text>
                  <Text 
                    className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Start your meal journey by choosing a subscription plan
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(home)/home-chef')}
                    className="mt-6 rounded-lg bg-black px-6 py-3 dark:bg-white">
                    <Text
                      className="text-sm font-medium text-white dark:text-black"
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      Browse Plans
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Information Notes */}
              <View className="mb-6 gap-2">
                <View className="flex-row items-start">
                  <Feather
                    name="alert-triangle"
                    size={16}
                    color={colorScheme === 'dark' ? '#FCD34D' : '#F59E0B'}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    className="ml-3 flex-1 text-sm text-gray-600 dark:text-gray-300"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Cancelled subscriptions don't have any refund
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Feather
                    name="refresh-cw"
                    size={16}
                    color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    className="ml-3 flex-1 text-sm text-gray-600 dark:text-gray-300"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Switch between vendor food to home chef & Vice-versa
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View>
              {pastSubscriptions.length > 0 ? (
                pastSubscriptions.map((subscription) => (
                  <SubscriptionCard 
                    key={subscription._id} 
                    subscription={subscription} 
                    isActive={false} 
                    onCancel={handleCancelSubscription}
                    onViewOrders={handleViewOrders}
                    onSwitch={handleSwitchVendor}
                  />
                ))
              ) : (
                <View className="py-20 items-center px-6">
                  <Feather name="clock" size={48} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                  <Text 
                    className="mt-4 text-center text-lg font-medium text-gray-600 dark:text-gray-300"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    No Past Subscriptions
                  </Text>
                  <Text 
                    className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Your completed subscription history will appear here
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default Subscription;
