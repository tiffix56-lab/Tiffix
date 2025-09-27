import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { orderService } from '@/services/order.service';

interface Order {
  _id: string;
  deliveryTime?: string; // Can be just time like "20:00" or full datetime
  deliveryDate?: string; // The actual delivery date from backend
  orderDate?: string;    // Order creation date
  status: 'upcoming' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'skipped';
  mealType: 'lunch' | 'dinner';
  selectedMenus?: Array<{
    foodTitle: string;
    foodImage?: string;
    price: number;
  }>;
}

const Calendar = () => {
  const { colorScheme } = useColorScheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchOrdersForMonth();
  }, [currentMonth]);

  const fetchOrdersForMonth = async () => {
    console.log('📅 [CALENDAR] Fetching all upcoming orders for subscriptions...');
    setLoading(true);
    
    try {
      // Fetch all orders without date filtering to show all upcoming orders
      console.log('📅 [CALENDAR] Getting all user orders...');
      const response = await orderService.getUserOrders({
        limit: 100, // Get more orders to show all upcoming ones
        days: 30    // Backend limit: max 30 days
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
            orderDate: o.orderDate,
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
    
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
    const dayOrders = orders.filter(order => {
      try {
        // Handle different date formats safely
        let orderDateStr = '';
        
        // Priority: deliveryDate > deliveryTime (if full datetime) > orderDate
        if (order.deliveryDate) {
          // Use deliveryDate (most accurate for calendar display)
          const deliveryDate = new Date(order.deliveryDate);
          if (!isNaN(deliveryDate.getTime())) {
            orderDateStr = deliveryDate.toISOString().split('T')[0];
          }
        } else if (order.deliveryTime) {
          // deliveryTime might be just time (e.g., "20:00") or full datetime
          if (order.deliveryTime.includes('T') || order.deliveryTime.includes('-')) {
            // Full datetime
            const orderDate = new Date(order.deliveryTime);
            if (!isNaN(orderDate.getTime())) {
              orderDateStr = orderDate.toISOString().split('T')[0];
            }
          } else {
            // Just time, use orderDate for the date part
            if (order.orderDate) {
              const baseDate = new Date(order.orderDate);
              if (!isNaN(baseDate.getTime())) {
                orderDateStr = baseDate.toISOString().split('T')[0];
              }
            }
          }
        } else if (order.orderDate) {
          // Use orderDate as fallback
          const orderDate = new Date(order.orderDate);
          if (!isNaN(orderDate.getTime())) {
            orderDateStr = orderDate.toISOString().split('T')[0];
          }
        }
        
        return orderDateStr === dateStr;
      } catch (error) {
        console.warn('📅 [CALENDAR] Invalid date in order:', { 
          orderId: order._id, 
          deliveryDate: order.deliveryDate,
          deliveryTime: order.deliveryTime, 
          orderDate: order.orderDate, 
          error: error.message 
        });
        return false;
      }
    });
    
    if (dayOrders.length > 0) {
      console.log(`📅 [CALENDAR] Found ${dayOrders.length} orders for ${dateStr}:`, dayOrders.map(o => ({ id: o._id, status: o.status, date: o.deliveryTime || o.orderDate })));
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
      
      let backgroundColor = '';
      let textColor = '';

      if (dayOrders.length > 0) {
        // Check order status to determine color
        const hasDelivered = dayOrders.some(order => order?.status === 'delivered');
        const hasUpcoming = dayOrders.some(order => order?.status && ['upcoming', 'preparing', 'out_for_delivery'].includes(order.status));
        const hasCancelled = dayOrders.some(order => order?.status && ['cancelled', 'skipped'].includes(order.status));

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
      } else {
        backgroundColor = '';
        textColor = colorScheme === 'dark' ? 'text-white' : 'text-black';
      }

      days.push(
        <TouchableOpacity
          key={day}
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
    </View>
  );
};

export default Calendar;
