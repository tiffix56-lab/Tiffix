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
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { subscriptionService } from '@/services/subscription.service';
import { orderService } from '@/services/order.service';
import { reviewService } from '@/services/review.service';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

import { UserSubscription } from '@/types/userSubscription.types';

interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  userSubscriptionId?: {
    _id: string;
    subscriptionId?: {
      _id: string;
      planName: string;
      category: string;
    };
    mealTiming: any;
    skipCreditAvailable: number;
  };
  selectedMenus?: Array<{
    _id: string;
    foodTitle: string;
    foodImage?: string;
    price: number;
    description?: {
      short: string;
      long?: string;
    };
  }>;
  vendorDetails?: {
    vendorId: {
      _id: string;
      businessInfo?: {
        businessName: string;
      };
    };
  };
  deliveryDate: string;
  deliveryTime: string;
  mealType: 'lunch' | 'dinner';
  status: 'upcoming' | 'preparing' | 'out_for_delivery' | 'delivered' | 'skipped' | 'cancelled';
  specialInstructions?: string;
  skipDetails?: {
    skipReason?: string;
    isSkipped?: boolean;
  };
  cancellationDetails?: {
    cancelReason?: string;
    isCancelled?: boolean;
  };
  deliveryConfirmation?: {
    deliveryNotes?: string;
    deliveredAt?: string;
  };
  createdAt: string;
  updatedAt: string;
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
  onReview: (orderId: string, subscriptionId: string, vendorId: string) => void;
}

const Subscription = () => {
  const { colorScheme } = useColorScheme();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showOrdersSheet, setShowOrdersSheet] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch subscriptions only (like profile page)
      const response = await subscriptionService.getUserSubscriptions();

      if (response.success && response.data) {
        const subscriptions = response.data.subscriptions || [];
        setSubscriptions(subscriptions);

        // Now fetch orders if subscriptions were loaded successfully
        if (subscriptions.length > 0) {
          try {
            // Try to get more comprehensive order data
            const ordersResponse = await orderService.getUserOrders({
              page: 1,
              limit: 100, // Get more orders
              days: 30    // Get orders from last 30 days (API limit)
            });

            if (ordersResponse.success && ordersResponse.data) {
              const ordersList = ordersResponse.data.orders || [];

              setOrders(ordersList);

              // Auto-select first active subscription for orders display
              if (!selectedSubscriptionId && subscriptions.length > 0) {
                const activeSubscription = subscriptions.find(sub => sub.status === 'active') || subscriptions[0];
                setSelectedSubscriptionId(activeSubscription._id);
              }
            } else {
              setOrders([]);
            }
          } catch (orderError) {
            setOrders([]);
          }
        }
      } else {
        setOrders([]); // Clear orders if subscriptions failed
      }

    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSkipOrder = async (orderId: string) => {
    Alert.alert(
      'Skip Order',
      'Are you sure you want to skip this order? This will use one of your skip credits.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await orderService.skipOrder(orderId, 'User requested skip from subscription tab');

              if (response.success) {
                Alert.alert(
                  'Order Skipped',
                  'Your order has been skipped successfully. A skip credit has been used.',
                  [{ text: 'OK', onPress: () => fetchData() }]
                );
              } else {
                Alert.alert('Skip Failed', response.message || 'Failed to skip order. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to skip order. Please check your connection and try again.');
            }
          },
        },
      ]
    );
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone and you may not receive a refund.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await orderService.cancelOrder(orderId, 'User requested cancellation from subscription tab');

              if (response.success) {
                Alert.alert(
                  'Order Cancelled',
                  'Your order has been cancelled successfully.',
                  [{ text: 'OK', onPress: () => fetchData() }]
                );
              } else {
                Alert.alert('Cancellation Failed', response.message || 'Failed to cancel order. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order. Please check your connection and try again.');
            }
          },
        },
      ]
    );
  };

  const handleReviewOrder = async (orderId: string, subscriptionId: string, vendorId: string) => {
    // Navigate to review screen or show review modal
    router.push(`/(profile)/review?orderId=${orderId}&subscriptionId=${subscriptionId}&vendorId=${vendorId}`);
  };

  const handleCancelSubscription = (subscriptionId: string) => {
    setSubscriptionToCancel(subscriptionId);
    setShowCancelModal(true);
  };

  const confirmCancelSubscription = async () => {
    if (!subscriptionToCancel) return;

    try {
      setCancelling(true);
      const response = await subscriptionService.cancelUserSubscription(
        subscriptionToCancel,
        'User requested cancellation'
      );
      if (response.success) {
        setShowCancelModal(false);
        Alert.alert('Success', 'Subscription cancelled successfully');
        fetchData();
      } else {
        Alert.alert('Error', response.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
      setSubscriptionToCancel(null);
    }
  };

  const handleViewOrders = async (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setShowOrdersSheet(true);

    // Fetch orders specifically for this subscription
    try {
      setLoadingOrders(true);
      const ordersResponse = await orderService.getUserOrders({
        page: 1,
        limit: 100,
        // days: 30
      });

      if (ordersResponse.success && ordersResponse.data) {
        const allOrders = ordersResponse.data.orders || [];

        // Filter orders by the selected subscription using correct property names
        const filteredOrders = allOrders.filter(order => {
          // Use the correct property from backend response
          const matches = order.userSubscriptionId?._id === subscriptionId;
          return matches;
        });

        setOrders(filteredOrders);

        // If no filtered orders found, show debug info
        if (filteredOrders.length === 0) {
          // For debugging, show all orders if none are filtered
          setOrders(allOrders);
        }
      } else {
        setOrders([]);
      }
    } catch (error) {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSwitchVendor = (subscriptionId: string) => {
    // Find the subscription to get its current category
    const subscription = subscriptions.find(sub => sub._id === subscriptionId);
    if (!subscription) {
      Alert.alert('Error', 'Subscription not found');
      return;
    }

    const currentCategory = subscription.subscriptionId.category;

    // Simple switching based on current category
    if (currentCategory === 'home_chef') {
      Alert.alert(
        'Switch Home Chef',
        'Do you want to switch to a different home chef for your subscription?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch Home Chef', onPress: () => requestVendorSwitch(subscriptionId, 'home_chef') }
        ]
      );
    } else if (currentCategory === 'food_vendor') {
      Alert.alert(
        'Switch Vendor',
        'Do you want to switch to a different vendor for your subscription?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch Vendor', onPress: () => requestVendorSwitch(subscriptionId, 'food_vendor') }
        ]
      );
    } else {
      Alert.alert(
        'Switch Not Available',
        'Switching is not available for this subscription type.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const requestVendorSwitch = async (subscriptionId: string, targetCategory: string) => {
    try {
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
      Alert.alert('Error', 'Failed to submit switch request. Please try again.');
    }
  };

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

  // Filter orders by selected subscription using correct backend property
  const subscriptionOrders = selectedSubscriptionId
    ? orders.filter(order => {
      const userSubId = order.userSubscriptionId?._id;
      const matches = userSubId === selectedSubscriptionId;

      return matches;
    })
    : orders;

  const upcomingOrders = subscriptionOrders.filter(order => {
    const isUpcoming = ['upcoming', 'preparing', 'out_for_delivery'].includes(order.status);
    return isUpcoming;
  });

  const deliveredOrders = subscriptionOrders.filter(order =>
    ['delivered', 'skipped', 'cancelled'].includes(order.status)
  );

  const formatDate = (dateString: string) => {
    const dates = new Date(dateString);
    const istDate = new Date(dates.getTime() + 5.5 * 60 * 60 * 1000);
    const date = new Date(istDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return date

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
            source={subscription.subscriptionId.category === 'food_vendor' ? require('@/assets/category-1.png') : require('@/assets/category-2.png')}
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
            <View className={`mb-4 rounded-md border px-2 py-1 ${subscription.status === 'active'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
              }`}>
              <Text
                className={`text-xs font-medium ${subscription.status === 'active'
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-400'
                  }`}
                style={{ fontFamily: 'Poppins_500Medium' }}>
                {subscription.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text
            className="mb-3 text-sm text-gray-600 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            {subscription.subscriptionId.category.replace('_', ' ').toUpperCase()} • {subscription.subscriptionId.durationDays} days
          </Text>

          <View className="mb-2">
            <View className="flex-row items-center">
              <Feather
                name="calendar"
                size={14}
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
              />
              <Text
                className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Valid until {formatDate(subscription.endDate)}
                {subscription.analytics?.remainingDays !== undefined && subscription.analytics.remainingDays > 0 &&
                  `\n ${subscription.analytics.remainingDays - 1} Days Left`
                }
              </Text>

            </View>

            <View className="flex-row items-center mt-1">
              <Feather
                name="skip-forward"
                size={14}
                color={colorScheme === 'dark' ? '#3B82F6' : '#2563EB'}
              />
              <Text
                className="ml-2 text-sm text-blue-600 dark:text-blue-400"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                {subscription.skipCreditAvailable} skips • Credits: {subscription.analytics?.remainingCredits || (subscription.creditsGranted - subscription.creditsUsed)}/{subscription.creditsGranted}
              </Text>
            </View>

            {isActive && (
              <TouchableOpacity
                className="flex-row items-center mt-2"
                onPress={() => onSwitch(subscription._id)}>
                <Feather
                  name="refresh-cw"
                  size={14}
                  color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Switch Vendor
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Progress Bar */}
          {subscription.analytics && (
            <View className="mb-3">
              <View className="mb-1 flex-row items-center justify-between">
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
          {isActive && (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-lg bg-red-500 py-3"
                onPress={() => onCancel(subscription._id)}>
                <Text
                  className="text-center text-sm font-medium text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-lg bg-black py-3 dark:bg-white"
                onPress={() => onViewOrders(subscription._id)}>
                <Text
                  className="text-center text-sm font-medium text-white dark:text-black"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Orders
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const OrderCard: React.FC<OrderCardProps> = ({ order, isUpcoming = false, onSkip, onCancel, onReview }) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
      return istDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    };

    const formatTime = (timeString: string) => {
      // Handle both "HH:MM" format and full datetime
      if (timeString.includes(':') && timeString.length <= 5) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
      }
      return new Date(timeString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const getStatusColor = () => {
      switch (order.status) {
        case 'upcoming': return 'bg-blue-500 text-white dark:bg-blue-400 dark:text-blue-950';
        case 'preparing': return 'bg-orange-500 text-white dark:bg-orange-400 dark:text-orange-950';
        case 'out_for_delivery': return 'bg-purple-500 text-white dark:bg-purple-400 dark:text-purple-950';
        case 'delivered': return 'bg-green-500 text-white dark:bg-green-400 dark:text-green-950';
        case 'cancelled': return 'bg-red-500 text-white dark:bg-red-400 dark:text-red-950';
        case 'skipped': return 'bg-gray-500 text-white dark:bg-gray-400 dark:text-gray-950';
        default: return 'bg-gray-500 text-white dark:bg-gray-400 dark:text-gray-950';
      }
    };

    return (
      <View className="mb-4 overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-neutral-800"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>

        {/* Order Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <View className="flex-row items-center">
            <View className="mr-3 h-3 w-3 rounded-full bg-blue-500" />
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Poppins_500Medium' }}>
              Order #{order.orderNumber?.slice(-4) || order._id.slice(-4)}
            </Text>
          </View>
          <View className={`rounded-full px-3 py-1 ${getStatusColor()}`}>
            <Text className="text-xs font-semibold capitalize dark:text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {order.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View className="flex-row px-4 pb-4">
          {/* Meal Image - Responsive */}
          <View className="mr-4">
            <View className="overflow-hidden rounded-xl">
              <Image
                source={order.selectedMenus?.[0]?.foodImage ? { uri: order.selectedMenus[0].foodImage } : require('@/assets/category-2.png')}
                className="h-24 w-24"
                style={{ aspectRatio: 1 }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Meal Details - Flexible */}
          <View className="flex-1">
            {/* Meal Title */}
            <Text
              className="mb-1 text-lg font-bold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_700Bold' }}
              numberOfLines={1}>
              {order.selectedMenus?.[0]?.foodTitle || 'Delicious Meal'}
            </Text>

            {/* Meal Description */}
            {order.selectedMenus?.[0]?.description?.short && (
              <Text
                className="mb-2 text-xs text-gray-500 text-wrap dark:text-gray-400"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                {order.selectedMenus[0].description.short}
              </Text>
            )}

            {/* Meal Type Badge */}
            <View className="mb-2 self-start rounded-lg bg-amber-50 px-3 py-1 dark:bg-amber-900/20">
              <Text
                className="text-xs font-semibold text-amber-700 dark:text-amber-400"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {order.mealType?.toUpperCase() || 'MEAL'}
              </Text>
            </View>

            {/* Date and Time */}
            <View className="flex-row items-center">
              <Feather
                name="calendar"
                size={14}
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
              />
              <Text
                className="ml-1.5 text-sm text-gray-600 dark:text-gray-300"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                {formatDate(order.deliveryDate)}
              </Text>
              <View className="mx-2 h-1 w-1 rounded-full bg-gray-400" />
              <Feather
                name="clock"
                size={14}
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
              />
              <Text
                className="ml-1.5 text-sm text-gray-600 dark:text-gray-300"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                {formatTime(order.deliveryTime)}
              </Text>
            </View>

            {/* Price Display (if available) */}
            {/* {order.selectedMenus?.[0]?.price && (
              <View className="mt-1 flex-row items-center">
                <Feather
                  name="tag"
                  size={14}
                  color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className="ml-1.5 text-sm font-semibold text-green-600 dark:text-green-400"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  ₹{order.selectedMenus[0].price}
                </Text>
              </View>
            )} */}
          </View>
        </View>

        {/* Action Buttons */}
        {isUpcoming ? (
          <View className="flex-row border-t border-gray-100 dark:border-neutral-700">
            <TouchableOpacity
              className="flex-1 items-center justify-center border-r border-gray-100 py-4 dark:border-neutral-700"
              onPress={() => onCancel(order._id)}
              activeOpacity={0.7}>
              <View className="flex-row items-center">
                <Feather name="x-circle" size={16} color="#EF4444" />
                <Text
                  className="ml-2 text-sm font-semibold text-red-500"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Cancel
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center justify-center py-4"
              onPress={() => onSkip(order._id)}
              activeOpacity={0.7}>
              <View className="flex-row items-center">
                <Feather name="skip-forward" size={16} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
                <Text
                  className="ml-2 text-sm font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Skip
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : order.status === 'delivered' ? (
          <View className="border-t border-gray-100 dark:border-neutral-700">
            <TouchableOpacity
              className="w-full items-center justify-center py-4"
              onPress={() => {
                if (order.userSubscriptionId && order.userSubscriptionId.subscriptionId && order.userSubscriptionId.vendorDetails && order.userSubscriptionId.vendorDetails.currentVendor)
                  onReview(order._id, order.userSubscriptionId?.subscriptionId?._id, order.userSubscriptionId.vendorDetails.currentVendor.vendorId);
              }}
              activeOpacity={0.7}>
              <View className="flex-row items-center">
                <Feather name="star" size={16} color="#F59E0B" />
                <Text
                  className="ml-2 text-sm font-semibold text-amber-600 dark:text-amber-400"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Write Review
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
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
                    className={`text-center text-base font-semibold ${activeTab === 'upcoming'
                      ? 'text-black dark:text-white'
                      : 'text-gray-600 dark:text-gray-900'
                      }`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 rounded-full px-6 py-3"
                  onPress={() => setActiveTab('delivered')}
                  activeOpacity={0.8}
                  style={{ zIndex: 2 }}>
                  <Text
                    className={`text-center text-base font-semibold ${activeTab === 'delivered'
                      ? 'text-black dark:text-white'
                      : 'text-gray-600 dark:text-gray-900'
                      }`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              <Text className="mt-4 text-gray-600 dark:text-gray-300">Loading subscriptions...</Text>
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
                <View className="py-0 items-center px-6">
                  <LottieView
                    source={{ uri: 'https://lottie.host/b29dbe63-8669-4f7c-9b29-8402f9e0cc67/WhrRi7aLnS.json' }}
                    autoPlay
                    loop
                    style={{ width: 300, height: 300, marginTop: 20 }}
                  />
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
                    onPress={() => router.push('/(home)/vendor-food')}
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
              {/* <View className="mb-6 gap-2">
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
              </View> */}
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

      {/* Orders Bottom Sheet */}
      <Modal
        visible={showOrdersSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOrdersSheet(false)}>
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowOrdersSheet(false)}
            className="flex-1"
          />
          <View
            style={{ maxHeight: Dimensions.get('window').height * 0.85 }}
            className="rounded-t-3xl bg-white dark:bg-neutral-800">
            {/* Sheet Header */}
            <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-neutral-700">
              <Text
                className="text-xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Orders
              </Text>
              <TouchableOpacity
                onPress={() => setShowOrdersSheet(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-700">
                <Feather name="x" size={20} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>

            {/* Sheet Content */}
            {loadingOrders ? (
              <View className="items-center justify-center py-20">
                <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
                <Text className="mt-4 text-gray-600 dark:text-gray-300">Loading orders...</Text>
              </View>
            ) : (
              <ScrollView
                className="px-6 pt-4"
                showsVerticalScrollIndicator={false}
                bounces={true}>
                {/* Upcoming Orders */}
                <Text className="mb-4 text-lg font-semibold text-black dark:text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Upcoming Orders
                </Text>
                {upcomingOrders.length > 0 ? (
                  <View className="mb-6">
                    {upcomingOrders.map((order) => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        isUpcoming={true}
                        onSkip={handleSkipOrder}
                        onCancel={handleCancelOrder}
                        onReview={handleReviewOrder}
                      />
                    ))}
                  </View>
                ) : (
                  <View className="mb-6 items-center py-8">
                    <View className="mb-4 rounded-full bg-blue-50 p-6 dark:bg-blue-900/20">
                      <Feather name="calendar" size={32} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                    </View>
                    <Text
                      className="mb-2 text-center text-lg font-semibold text-gray-800 dark:text-gray-200"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      No Upcoming Orders
                    </Text>
                    <Text
                      className="text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400"
                      style={{ fontFamily: 'Poppins_400Regular', maxWidth: 280 }}>
                      {orders.length === 0
                        ? 'Orders will appear here once your subscription generates them.'
                        : 'No upcoming orders for this subscription'}
                    </Text>
                  </View>
                )}

                {/* Delivered Orders */}
                <Text className="mb-4 text-lg font-semibold text-black dark:text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Delivered Orders
                </Text>
                {deliveredOrders.length > 0 ? (
                  <View className="mb-6 pb-6">
                    {deliveredOrders.map((order) => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        isUpcoming={false}
                        onSkip={handleSkipOrder}
                        onCancel={handleCancelOrder}
                        onReview={handleReviewOrder}
                      />
                    ))}
                  </View>
                ) : (
                  <View className="mb-6 items-center py-8 pb-12">
                    <View className="mb-4 rounded-full bg-green-50 p-6 dark:bg-green-900/20">
                      <Feather name="package" size={32} color={colorScheme === 'dark' ? '#10B981' : '#059669'} />
                    </View>
                    <Text
                      className="mb-2 text-center text-lg font-semibold text-gray-800 dark:text-gray-200"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      No Delivered Orders
                    </Text>
                    <Text
                      className="text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400"
                      style={{ fontFamily: 'Poppins_400Regular', maxWidth: 280 }}>
                      {orders.length === 0
                        ? 'Your completed orders will appear here'
                        : 'No delivered orders for this subscription yet'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Cancel Subscription Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-800">
            {/* Icon */}
            <View className="mb-4 items-center">
              <View className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
                <Feather name="alert-circle" size={48} color="#EF4444" />
              </View>
            </View>

            {/* Title */}
            <Text
              className="mb-3 text-center text-2xl font-bold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_700Bold' }}>
              Cancel Subscription?
            </Text>

            {/* Description */}
            <Text
              className="mb-6 text-center text-base leading-relaxed text-gray-600 dark:text-gray-300"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              Are you sure you want to cancel this subscription?
            </Text>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setSubscriptionToCancel(null);
                }}
                disabled={cancelling}
                className="flex-1 rounded-xl border-2 border-gray-200 bg-white py-4 dark:border-neutral-600 dark:bg-neutral-700"
                activeOpacity={0.7}>
                <Text
                  className="text-center text-base font-semibold text-gray-700 dark:text-gray-200"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Keep Plan
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmCancelSubscription}
                disabled={cancelling}
                className="flex-1 rounded-xl bg-red-500 py-4"
                activeOpacity={0.7}>
                {cancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    className="text-center text-base font-semibold text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Yes, Cancel
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Subscription;
