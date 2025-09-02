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
import { orderService } from '@/services/order.service';
import { reviewService } from '@/services/review.service';

const { width } = Dimensions.get('window');

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getMyOrders();
      
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
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
                fetchOrders();
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
                fetchOrders();
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

  const upcomingOrders = orders.filter(order => 
    ['pending', 'confirmed', 'prepared', 'out_for_delivery'].includes(order.status)
  );
  
  const deliveredOrders = orders.filter(order => 
    ['delivered'].includes(order.status)
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
                {new Date(order.orderDate).toLocaleDateString()} at {order.deliveryTime}
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
              </View>
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              <Text className="mt-4 text-gray-600 dark:text-gray-300">Loading orders...</Text>
            </View>
          ) : activeTab === 'upcoming' ? (
            <View>
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
                <View className="py-20 items-center">
                  <Text className="text-gray-600 dark:text-gray-300">No upcoming orders</Text>
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
                    Cancelled food doesn't have any refund
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
                <View className="py-20 items-center">
                  <Text className="text-gray-600 dark:text-gray-300">No delivered orders</Text>
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
