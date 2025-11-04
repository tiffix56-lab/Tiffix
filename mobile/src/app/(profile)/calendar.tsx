import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Modal, Image } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { orderService } from '@/services/order.service';

interface Order {
  _id: string;
  orderNumber?: string;
  deliveryTime: string;
  deliveryDate: string;
  status: 'upcoming' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'skipped';
  mealType: 'lunch' | 'dinner';
  selectedMenus?: Array<{
    _id: string;
    foodTitle: string;
    foodImage?: string;
    price: number;
  }>;
  vendorDetails?: {
    vendorId: {
      _id: string;
      businessInfo?: {
        businessName: string;
      };
    };
  };
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
}

const Calendar = () => {
  const { colorScheme } = useColorScheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedDateOrders, setSelectedDateOrders] = useState<Order[]>([]);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchOrdersForMonth();
  }, [currentMonth]);

  const fetchOrdersForMonth = async () => {
    console.log('📅 [CALENDAR] Fetching orders for selected month...');
    setLoading(true);

    try {
      // Calculate start and end date of the selected month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      // First day of the month (in local timezone)
      const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;

      // Last day of the month (in local timezone)
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

      console.log('📅 [CALENDAR] Fetching orders from', startDateStr, 'to', endDateStr);

      const response = await orderService.getUserOrders({
        limit: 100,
        startDate: startDateStr,
        endDate: endDateStr,
      });

      console.log('📅 [CALENDAR] Orders response success:', response.success);
      console.log('📅 [CALENDAR] Orders response data:', response.data);
      console.log('📅 [CALENDAR] Orders response message:', response.message);

      if (response.success && response.data) {
        const ordersList = response.data.orders || [];
        console.log('📅 [CALENDAR] Orders found:', ordersList.length);

        if (ordersList.length > 0) {
          console.log('📅 [CALENDAR] Sample orders:', ordersList.slice(0, 2));
          console.log('📅 [CALENDAR] Order dates:', ordersList.map(o => ({
            id: o._id,
            deliveryDate: o.deliveryDate,
            deliveryTime: o.deliveryTime,
            status: o.status
          })));
        } else {
          console.log('📅 [CALENDAR] No orders in response - this could be normal for new subscriptions');
        }

        setOrders(ordersList);
      } else {
        console.log('📅 [CALENDAR] API returned no success:', response.message);
        setOrders([]);
      }
    } catch (error) {
      console.error('📅 [CALENDAR] Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getOrdersForDate = (day: number) => {
    if (!orders || orders.length === 0) return [];

    // Create date string in local timezone format (YYYY-MM-DD)
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const dayOrders = orders.filter(order => {
      try {
        // Handle different date formats safely
        let orderDateStr = '';

        // Priority: deliveryDate > deliveryTime (if full datetime) > orderDate
        if (order.deliveryDate) {
          // Use deliveryDate (most accurate for calendar display)
          // Parse the date and extract local date part without timezone conversion
          if (order.deliveryDate.includes('T') || order.deliveryDate.includes('Z')) {
            // Full datetime ISO string - extract just the date part before 'T'
            orderDateStr = order.deliveryDate.split('T')[0];
          } else if (order.deliveryDate.includes('-')) {
            // Already in YYYY-MM-DD format
            orderDateStr = order.deliveryDate;
          } else {
            // Try parsing as date
            const deliveryDate = new Date(order.deliveryDate);
            if (!isNaN(deliveryDate.getTime())) {
              // Convert to local date string
              const localYear = deliveryDate.getFullYear();
              const localMonth = deliveryDate.getMonth() + 1;
              const localDay = deliveryDate.getDate();
              orderDateStr = `${localYear}-${String(localMonth).padStart(2, '0')}-${String(localDay).padStart(2, '0')}`;
            }
          }
        } else if (order.deliveryTime) {
          // deliveryTime might be just time (e.g., "20:00") or full datetime
          if (order.deliveryTime.includes('T') || order.deliveryTime.includes('-')) {
            // Full datetime - extract date part
            if (order.deliveryTime.includes('T')) {
              orderDateStr = order.deliveryTime.split('T')[0];
            } else {
              const orderDate = new Date(order.deliveryTime);
              if (!isNaN(orderDate.getTime())) {
                const localYear = orderDate.getFullYear();
                const localMonth = orderDate.getMonth() + 1;
                const localDay = orderDate.getDate();
                orderDateStr = `${localYear}-${String(localMonth).padStart(2, '0')}-${String(localDay).padStart(2, '0')}`;
              }
            }
          }
          // Note: If deliveryTime is just time without date, we can't determine the date
        }

        return orderDateStr === dateStr;
      } catch (error) {
        console.warn('📅 [CALENDAR] Invalid date in order:', {
          orderId: order._id,
          deliveryDate: order.deliveryDate,
          deliveryTime: order.deliveryTime,
          error: error instanceof Error ? error.message : String(error)
        });
        return false;
      }
    });

    if (dayOrders.length > 0) {
      console.log(`📅 [CALENDAR] Found ${dayOrders.length} orders for ${dateStr}:`, dayOrders.map(o => ({ id: o._id, status: o.status, date: o.deliveryTime || o.deliveryDate })));
    }

    return dayOrders;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Adjust for Monday as first day of week
    const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1;

    return { daysInMonth, adjustedStartingDay };
  };

  const { daysInMonth, adjustedStartingDay } = getDaysInMonth(currentMonth);

  const renderCalendarDays = () => {
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(
        <View key={`empty-${i}`} className="h-12 w-12 items-center justify-center mb-2" style={{ width: '14.28%' }}>
          <Text className="text-transparent">1</Text>
        </View>
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOrders = getOrdersForDate(day) || [];

      let textColor = colorScheme === 'dark' ? 'text-white' : 'text-black';

      if (dayOrders.length > 0) {
        // Check order status to determine color priority
        const hasDelivered = dayOrders.some(order => order?.status === 'delivered');
        const hasUpcoming = dayOrders.some(order => order?.status && ['upcoming', 'preparing', 'out_for_delivery'].includes(order.status));
        const hasCancelled = dayOrders.some(order => order?.status && ['cancelled', 'skipped'].includes(order.status));

        // Count different statuses
        const statusCount = [hasDelivered, hasUpcoming, hasCancelled].filter(Boolean).length;

        if (statusCount > 1) {
          // Multiple statuses - show with line indicators
          days.push(
            <TouchableOpacity
              key={day}
              onPress={() => handleDatePress(day)}
              className="h-12 w-12 items-center justify-center rounded-lg mb-2 bg-gray-200 dark:bg-neutral-700"
              style={{ width: '14.28%' }}>
              <Text
                className="text-sm font-medium text-black dark:text-white"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                {day}
              </Text>
              <View className="absolute bottom-1 flex-row gap-0.5">
                {hasDelivered && <View className="h-0.5 w-3 bg-green-500" />}
                {hasUpcoming && <View className="h-0.5 w-3 bg-blue-500" />}
                {hasCancelled && <View className="h-0.5 w-3 bg-red-500" />}
              </View>
            </TouchableOpacity>
          );
        } else {
          // Single status - show with full background color
          let backgroundColor = '';
          if (hasDelivered) {
            backgroundColor = 'bg-green-500';
            textColor = 'text-white';
          } else if (hasUpcoming) {
            backgroundColor = 'bg-blue-500';
            textColor = 'text-white';
          } else if (hasCancelled) {
            backgroundColor = 'bg-red-500';
            textColor = 'text-white';
          }

          days.push(
            <TouchableOpacity
              key={day}
              onPress={() => handleDatePress(day)}
              className={`h-12 w-12 items-center justify-center rounded-lg mb-2 ${backgroundColor}`}
              style={{ width: '14.28%' }}>
              <Text
                className={`text-sm font-medium ${textColor}`}
                style={{ fontFamily: 'Poppins_500Medium' }}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        }
      } else {
        days.push(
          <TouchableOpacity
            key={day}
            className="h-12 w-12 items-center justify-center rounded-lg mb-2"
            style={{ width: '14.28%' }}>
            <Text
              className={`text-sm font-medium ${textColor}`}
              style={{ fontFamily: 'Poppins_500Medium' }}>
              {day}
            </Text>
          </TouchableOpacity>
        );
      }
    }

    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    // fetchOrdersForMonth will be called automatically by useEffect
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  const handleDatePress = (day: number) => {
    const dayOrders = getOrdersForDate(day);
    if (dayOrders.length > 0) {
      setSelectedDate(day);
      setSelectedDateOrders(dayOrders);
      setShowModal(true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    // Handle both "HH:MM" format and full datetime
    if (timeString.includes(':') && timeString.length <= 5) {
      return timeString;
    }
    return new Date(timeString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'preparing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'skipped': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <View
      className="mb-4 overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-neutral-800"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
      }}>
      {/* Order Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View className="flex-row items-center">
          <View className="mr-3 h-3 w-3 rounded-full bg-blue-500" />
          <Text
            className="text-sm font-medium text-gray-500 dark:text-gray-400"
            style={{ fontFamily: 'Poppins_500Medium' }}>
            Order #{order.orderNumber?.slice(-4) || order._id.slice(-4)}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${getStatusColor(order.status)}`}>
          <Text
            className="text-xs font-semibold capitalize"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {order.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View className="flex-row px-4 pb-4">
        {/* Meal Image */}
        <View className="mr-4">
          <View className="overflow-hidden rounded-xl">
            <Image
              source={
                order.selectedMenus?.[0]?.foodImage
                  ? { uri: order.selectedMenus[0].foodImage }
                  : require('@/assets/category-2.png')
              }
              className="h-24 w-24"
              style={{ aspectRatio: 1 }}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Meal Details */}
        <View className="flex-1">
          {/* Meal Title */}
          <Text
            className="mb-2 text-lg font-bold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_700Bold' }}
            numberOfLines={2}>
            {order.selectedMenus?.[0]?.foodTitle || 'Delicious Meal'}
          </Text>

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

          {/* Price Display */}
          {order.selectedMenus?.[0]?.price && (
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
              Calendar
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Month Navigation */}
          <View className=" flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => changeMonth('prev')}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
              <Feather
                name="chevron-left"
                size={20}
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>

            <Text
              className="text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {getMonthName(currentMonth)}
            </Text>

            <TouchableOpacity
              onPress={() => changeMonth('next')}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
              <Feather
                name="chevron-right"
                size={20}
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View className="mb-4 flex-row">
            {daysOfWeek.map((day) => (
              <View key={day} className="h-12 w-12 items-center justify-center" style={{ width: '14.28%' }}>
                <Text
                  className="text-sm font-medium text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              <Text className="mt-4 text-gray-600 dark:text-gray-300">Loading orders...</Text>
            </View>
          ) : (
            <>
              <View className="flex-row flex-wrap">{renderCalendarDays()}</View>
              
              {/* Info message when no orders are found */}
              {!loading && orders.length === 0 && (
                <View className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <View className="flex-row items-center">
                    <Feather name="calendar" size={16} color="#3B82F6" />
                    <Text
                      className="ml-2 text-sm font-medium text-blue-800 dark:text-blue-200"
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      No Orders Scheduled This Month
                    </Text>
                  </View>
                  <Text
                    className="mt-2 text-sm text-blue-700 dark:text-blue-300"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    • If you have an active subscription, meal orders are automatically created by the system{'\n'}
                    • Orders typically appear 1-2 days before delivery{'\n'}
                    • New subscriptions may take 24-48 hours to generate first orders{'\n'}
                    • Try navigating to next month or check your subscription status
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Monthly Summary */}
          {!loading && orders.length > 0 && (
            <View className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-600">
              <Text
                className="mb-3 text-base font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Monthly Summary ({getMonthName(currentMonth)})
              </Text>
              <View className="flex-row flex-wrap gap-4">
                <View className="flex-row items-center">
                  <View className="mr-2 h-3 w-3 rounded-full bg-green-500" />
                  <Text className="text-sm text-gray-600 dark:text-gray-300">
                    {orders.filter(o => o.status === 'delivered').length} delivered
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="mr-2 h-3 w-3 rounded-full bg-blue-500" />
                  <Text className="text-sm text-gray-600 dark:text-gray-300">
                    {orders.filter(o => ['upcoming', 'preparing', 'out_for_delivery'].includes(o.status)).length} upcoming
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="mr-2 h-3 w-3 rounded-full bg-red-500" />
                  <Text className="text-sm text-gray-600 dark:text-gray-300">
                    {orders.filter(o => ['cancelled', 'skipped'].includes(o.status)).length} cancelled/skipped
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Legend */}
          <View className="mt-8 rounded-lg border border-gray-200 p-4 dark:border-gray-600">
            <Text
              className="mb-3 text-base font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Order Status Legend
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-center">
                <View className="mr-3 h-4 w-4 rounded-lg bg-green-500" />
                <Text
                  className="text-sm text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  Delivered orders
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="mr-3 h-4 w-4 rounded-lg bg-blue-500" />
                <Text
                  className="text-sm text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  Upcoming orders
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="mr-3 h-4 w-4 rounded-lg bg-red-500" />
                <Text
                  className="text-sm text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  Cancelled or skipped orders
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>

      {/* Orders Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20">
            <View className="flex-1 rounded-t-3xl bg-white dark:bg-neutral-900">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200 dark:border-neutral-700">
                <View>
                  <Text
                    className="text-2xl font-bold text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_700Bold' }}>
                    {selectedDate && `${getMonthName(currentMonth)} ${selectedDate}`}
                  </Text>
                  <Text
                    className="text-sm text-gray-600 dark:text-gray-400"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    {selectedDateOrders.length} {selectedDateOrders.length === 1 ? 'order' : 'orders'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
                  <Feather
                    name="x"
                    size={20}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  />
                </TouchableOpacity>
              </View>

              {/* Orders List */}
              <ScrollView
                className="flex-1 px-6 pt-4"
                showsVerticalScrollIndicator={false}>
                {selectedDateOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
                <View className="h-6" />
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Calendar;
