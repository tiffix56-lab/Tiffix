import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addressService } from '@/services/address.service';
import { subscriptionService } from '@/services/subscription.service';
import { menuService } from '@/services/menu.service';
import { Address } from '@/types/address.types';
import { MenuItem } from '@/types/menu.types';
import { Subscription } from '@/services/subscription.service';
import { orderStore } from '@/utils/order-store';
import { useAddress } from '@/context/AddressContext';

const Information = () => {
  const { colorScheme } = useColorScheme();
  const { subscriptionId, menuId } = useLocalSearchParams();
  const { savedAddresses, selectedAddress, setSelectedAddress, refreshAddresses } = useAddress();

  // Log when component mounts and when selectedAddress changes
  useEffect(() => {
    console.log('📄 [INFORMATION_PAGE] Mounted/Updated with selectedAddress:', selectedAddress?.label || 'none');
  }, [selectedAddress]);

  // Data states
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [lunchTime, setLunchTime] = useState('12:00');
  const [dinnerTime, setDinnerTime] = useState('20:00');
  const [lunchEnabled, setLunchEnabled] = useState(false);
  const [dinnerEnabled, setDinnerEnabled] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Date and Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLunchTimePicker, setShowLunchTimePicker] = useState(false);
  const [showDinnerTimePicker, setShowDinnerTimePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [lunchDateTime, setLunchDateTime] = useState(new Date());
  const [dinnerDateTime, setDinnerDateTime] = useState(new Date());

  useEffect(() => {
    fetchOrderData();
  }, []);

  const fetchOrderData = async () => {
    try {
      setLoading(true);

      // Refresh addresses from context (this will update savedAddresses and selectedAddress)
      await refreshAddresses();

      // Initialize other responses as null
      let subscriptionResponse: any = null;
      let menuResponse: any = null;

      // Fetch subscription and menu data separately
      if (subscriptionId) {
        subscriptionResponse = await subscriptionService.getSubscriptionById(subscriptionId as string);
      }

      if (menuId) {
        menuResponse = await menuService.getMenuById(menuId as string);
      }

      // Handle subscription
      if (subscriptionResponse && subscriptionResponse.success && subscriptionResponse.data) {
        console.log('Subscription data:', JSON.stringify(subscriptionResponse.data.subscription, null, 2));
        setSelectedSubscription(subscriptionResponse.data.subscription);
        // Auto-enable available meal timings
        setLunchEnabled(subscriptionResponse.data.subscription.mealTimings.isLunchAvailable);
        setDinnerEnabled(subscriptionResponse.data.subscription.mealTimings.isDinnerAvailable);
      } else {
        console.log('No subscription data or failed to load subscription');
      }

      // Handle menu
      if (menuResponse && menuResponse.success && menuResponse.data) {
        setSelectedMenu(menuResponse.data.menu);
      }

    } catch (err) {
      console.error('Error fetching order data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-select default address when addresses are loaded (only if no address is selected)
  useEffect(() => {
    console.log('🔍 Auto-select effect running:', {
      loading,
      savedAddressesCount: savedAddresses.length,
      hasSelectedAddress: !!selectedAddress,
      selectedAddressLabel: selectedAddress?.label || 'none',
      savedAddresses: savedAddresses.map(a => ({ label: a.label, isDefault: a.isDefault }))
    });

    // Only auto-select if no address is currently selected
    if (!loading && savedAddresses.length > 0 && !selectedAddress) {
      const defaultAddr = savedAddresses.find(addr => addr.isDefault);
      console.log('🎯 Default address found:', defaultAddr?.label || 'none');

      if (defaultAddr) {
        console.log('✅ Auto-selecting default address:', defaultAddr.label);
        setSelectedAddress(defaultAddr);
      } else {
        // If no default and nothing selected, select the first address
        console.log('✅ Auto-selecting first address:', savedAddresses[0].label);
        setSelectedAddress(savedAddresses[0]);
      }
    } else if (selectedAddress) {
      console.log('ℹ️ Keeping user-selected address:', selectedAddress.label);
    }
  }, [loading, savedAddresses]);


  // Date picker handlers
  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setSelectedDate(formattedDate);
    }
  };

  // Helper function to parse time string (e.g., "12:00 PM") to Date object
  const parseTimeString = (timeString: string): Date => {
    const date = new Date();
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Helper function to convert 24-hour time to 12-hour format for display
  const format12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Helper function to check if a time is within a window
  const isTimeInWindow = (selectedTime: Date, startTimeStr: string, endTimeStr: string): boolean => {
    const startTime = parseTimeString(startTimeStr);
    const endTime = parseTimeString(endTimeStr);

    const selectedHours = selectedTime.getHours();
    const selectedMinutes = selectedTime.getMinutes();
    const startHours = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const endHours = endTime.getHours();
    const endMinutes = endTime.getMinutes();

    const selectedTotalMinutes = selectedHours * 60 + selectedMinutes;
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return selectedTotalMinutes >= startTotalMinutes && selectedTotalMinutes <= endTotalMinutes;
  };

  // Time picker handlers
  const onLunchTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowLunchTimePicker(false);
    if (selectedTime && selectedSubscription?.mealTimings.lunchOrderWindow) {
      const { startTime, endTime } = selectedSubscription.mealTimings.lunchOrderWindow;

      if (!isTimeInWindow(selectedTime, startTime, endTime)) {
        Alert.alert(
          'Invalid Time',
          `Please select a time between ${startTime} and ${endTime} for lunch delivery.`
        );
        return;
      }

      setLunchDateTime(selectedTime);
      // Format as 24-hour time (HH:MM)
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      setLunchTime(formattedTime);
    }
  };

  const onDinnerTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowDinnerTimePicker(false);
    if (selectedTime && selectedSubscription?.mealTimings.dinnerOrderWindow) {
      const { startTime, endTime } = selectedSubscription.mealTimings.dinnerOrderWindow;

      if (!isTimeInWindow(selectedTime, startTime, endTime)) {
        Alert.alert(
          'Invalid Time',
          `Please select a time between ${startTime} and ${endTime} for dinner delivery.`
        );
        return;
      }
      setDinnerDateTime(selectedTime);
      // Format as 24-hour time (HH:MM)
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      console.log('🕐 [DINNER_TIME] Selected time:', formattedTime);
      setDinnerTime(formattedTime);
    }
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="bg-zinc-50 px-6 pb-6 pt-24 dark:bg-neutral-900">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800">
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
              Delivery Information
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            <Text className="mt-4 text-base text-zinc-500 dark:text-zinc-400">Loading addresses...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
            {/* Address Selection Section */}
            <View className="mb-8">
              <Text
                className="mb-4 text-xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Delivery Address
              </Text>

              {/* Saved Addresses */}
              {savedAddresses.length > 0 && (
                <View className="mb-4">
                  <Text
                    className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Saved Addresses
                  </Text>
                  {savedAddresses.map((address, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        console.log('📍 [INFORMATION] User clicked address:', address.label);
                        setSelectedAddress(address);
                        console.log('✅ [INFORMATION] Selected address updated in context:', address.label);
                      }}
                      className={`mb-3 rounded-xl border p-4 ${
                        selectedAddress?.label === address.label
                          ? 'border-black bg-black dark:border-white dark:bg-white'
                          : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                      }`}>
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text
                              className={`text-sm font-medium ${
                                selectedAddress?.label === address.label
                                  ? 'text-white dark:text-black'
                                  : 'text-zinc-700 dark:text-zinc-300'
                              }`}
                              style={{ fontFamily: 'Poppins_500Medium' }}>
                              {address.label}
                            </Text>
                            {address.isDefault && (
                              <View className="ml-2 rounded-full bg-green-500 px-2 py-1">
                                <Text
                                  className="text-xs font-medium text-white"
                                  style={{ fontFamily: 'Poppins_500Medium' }}>
                                  Default
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            className={`mt-1 text-sm ${
                              selectedAddress?.label === address.label
                                ? 'text-zinc-300 dark:text-zinc-700'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {[address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                          </Text>
                        </View>
                        <View className={`h-5 w-5 rounded-full border-2 ${
                          selectedAddress?.label === address.label
                            ? 'border-white bg-white dark:border-black dark:bg-black'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}>
                          {selectedAddress?.label === address.label && (
                            <View className="h-full w-full rounded-full bg-green-500" />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* No Saved Addresses */}
              {savedAddresses.length === 0 && (
                <View className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
                  <View className="items-center">
                    <Feather name="map-pin" size={32} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                    <Text
                      className="mt-2 text-center text-base font-medium text-zinc-600 dark:text-zinc-300"
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      No saved addresses
                    </Text>
                    <Text
                      className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400"
                      style={{ fontFamily: 'Poppins_400Regular' }}>
                      Add an address to continue with your order
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/(profile)/address')}
                      className="mt-4 rounded-lg bg-black px-6 py-3 dark:bg-white">
                      <Text
                        className="text-sm font-medium text-white dark:text-black"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        Add Address
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Add New Address Button */}
              {savedAddresses.length > 0 && (
                <TouchableOpacity
                  onPress={() => router.push('/(profile)/address')}
                  className="mb-4 flex-row items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-900">
                  <Feather name="plus" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <Text
                    className="ml-2 text-base font-medium text-zinc-600 dark:text-zinc-300"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Add New Address
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Date & Time Section */}
            <View className="mb-8">
              <Text
                className="mb-4 text-xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Select Delivery Date and Time
              </Text>

            {/* Date Input */}
            <View className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <View className="flex-row items-center">
                <Feather
                  name="calendar"
                  size={20}
                  color={colorScheme === 'dark' ? '#FFFFFF' : '#6B7280'}
                />
                <TouchableOpacity onPress={() => setShowDatePicker(true)} className="ml-3 flex-1">
                  <Text
                    className={`text-base ${
                      selectedDate
                        ? 'text-black dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    {selectedDate || 'Select delivery date'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#6B7280'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Slots */}
            <View>
              <View className="gap-2 space-y-4">
                {/* Lunch Time */}
                {selectedSubscription?.mealTimings.isLunchAvailable && (
                  <View className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                    <View className="mb-3 flex-row items-center justify-between">
                      <Text
                        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        Lunch Delivery Time
                      </Text>
                      {/* <TouchableOpacity
                        onPress={() => setLunchEnabled(!lunchEnabled)}
                        className={`h-6 w-11 rounded-full ${
                          lunchEnabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}>
                        <View
                          className={`h-5 w-5 rounded-full bg-white transition-transform ${
                            lunchEnabled ? 'translate-x-5' : 'translate-x-0.5'
                          } mt-0.5`}
                        />
                      </TouchableOpacity> */}
                    </View>
                    {lunchEnabled && (
                      <TouchableOpacity
                        onPress={() => setShowLunchTimePicker(true)}
                        className="flex-row items-center">
                        <Feather
                          name="clock"
                          size={16}
                          color={colorScheme === 'dark' ? '#FFFFFF' : '#6B7280'}
                        />
                        <Text
                          className="ml-2 text-base text-black dark:text-white"
                          style={{ fontFamily: 'Poppins_500Medium' }}>
                          {format12Hour(lunchTime)}
                        </Text>
                        <View className="ml-auto">
                          <Feather
                            name="chevron-down"
                            size={16}
                            color={colorScheme === 'dark' ? '#FFFFFF' : '#6B7280'}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                    <Text
                      className="mt-2 text-xs text-zinc-500 dark:text-zinc-400"
                      style={{ fontFamily: 'Poppins_400Regular' }}>
                      Available: {selectedSubscription?.mealTimings.lunchOrderWindow.startTime} - {selectedSubscription?.mealTimings.lunchOrderWindow.endTime}
                    </Text>
                  </View>
                )}

                {/* Dinner Time */}
                {selectedSubscription?.mealTimings.isDinnerAvailable && (
                  <View className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                    <View className="mb-3 flex-row items-center justify-between">
                      <Text
                        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        Dinner Delivery Time
                      </Text>
                      {/* <TouchableOpacity
                        onPress={() => setDinnerEnabled(!dinnerEnabled)}
                        className={`h-6 w-11 rounded-full ${
                          dinnerEnabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}>
                        <View
                          className={`h-5 w-5 rounded-full bg-white transition-transform ${
                            dinnerEnabled ? 'translate-x-5' : 'translate-x-0.5'
                          } mt-0.5`}
                        />
                      </TouchableOpacity> */}
                    </View>
                    {dinnerEnabled && (
                      <TouchableOpacity
                        onPress={() => setShowDinnerTimePicker(true)}
                        className="flex-row items-center">
                        <Feather
                          name="clock"
                          size={16}
                          color={colorScheme === 'dark' ? '#FFFFFF' : '#6B7280'}
                        />
                        <Text
                          className="ml-2 text-base text-black dark:text-white"
                          style={{ fontFamily: 'Poppins_500Medium' }}>
                          {format12Hour(dinnerTime)}
                        </Text>
                        <View className="ml-auto">
                          <Feather
                            name="chevron-down"
                            size={16}
                            color={colorScheme === 'dark' ? '#FFFFFF' : '#6B7280'}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                    <Text
                      className="mt-2 text-xs text-zinc-500 dark:text-zinc-400"
                      style={{ fontFamily: 'Poppins_400Regular' }}>
                      Available: {selectedSubscription?.mealTimings.dinnerOrderWindow.startTime} - {selectedSubscription?.mealTimings.dinnerOrderWindow.endTime}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date(new Date().setDate(new Date().getDate() + 1))}
        />
      )}

      {/* Lunch Time Picker */}
      {showLunchTimePicker && (
        <DateTimePicker
          value={lunchDateTime}
          mode="time"
          display="default"
          onChange={onLunchTimeChange}
        />
      )}

      {/* Dinner Time Picker */}
      {showDinnerTimePicker && (
        <DateTimePicker
          value={dinnerDateTime}
          mode="time"
          display="default"
          onChange={onDinnerTimeChange}
        />
      )}



      {/* Confirm Button */}
      {!loading  && (
        <View className="px-6 pb-6">
          <TouchableOpacity
            onPress={async () => {
              console.log('🚀 Continue to Order button pressed');
              console.log('🍽️ Lunch Enabled:', lunchEnabled, 'Time:', lunchTime);
              console.log('🍽️ Dinner Enabled:', dinnerEnabled, 'Time:', dinnerTime);

              // Use selected address from context
              const deliveryAddress = selectedAddress;

              console.log('📍 Final delivery address:', deliveryAddress);

              if (!deliveryAddress || !selectedDate) {
                console.log('❌ Missing information - Address:', !!deliveryAddress, 'Date:', !!selectedDate);
                if (!deliveryAddress) {
                  Alert.alert('Missing Address', 'Please select a saved address or add a new one from your profile.');
                } else {
                  Alert.alert('Missing Information', 'Please select a delivery date.');
                }
                return;
              }


              // Validate address has all required fields
              if (!deliveryAddress.label || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode) {
                console.log('❌ Incomplete address fields:', {
                  label: deliveryAddress.label,
                  street: deliveryAddress.street,
                  city: deliveryAddress.city,
                  state: deliveryAddress.state,
                  zipCode: deliveryAddress.zipCode
                });
                Alert.alert('Incomplete Address', 'The selected address is missing required information. Please select a complete saved address or add a new one.');
                return;
              }

              // Validate address coordinates (handle both coordinate formats)
              const hasValidCoords = deliveryAddress.coordinates && (
                ('latitude' in deliveryAddress.coordinates && 
                 typeof deliveryAddress.coordinates.latitude === 'number' && 
                 typeof deliveryAddress.coordinates.longitude === 'number') ||
                ('coordinates' in deliveryAddress.coordinates && 
                 Array.isArray(deliveryAddress.coordinates.coordinates) &&
                 deliveryAddress.coordinates.coordinates.length === 2)
              );
              
              if (!hasValidCoords) {
                console.log('❌ Invalid address coordinates:', deliveryAddress.coordinates);
                Alert.alert('Invalid Address', 'Selected address is missing location data. Please select a different address.');
                return;
              }

              if (!lunchEnabled && !dinnerEnabled) {
                console.log('❌ No meal times enabled');
                Alert.alert('Missing Information', 'Please enable at least one meal time.');
                return;
              }

              try {
                setSaving(true);
                console.log('💾 Preparing order data...');
                
                const deliveryInfo = {
                  subscriptionId: subscriptionId as string,
                  menuId: menuId as string,
                  deliveryAddress: deliveryAddress,
                  deliveryDate: selectedDate,
                  lunchTime: lunchEnabled ? lunchTime : '',
                  dinnerTime: dinnerEnabled ? dinnerTime : '',
                  lunchEnabled,
                  dinnerEnabled
                };
                
                console.log('📦 Delivery info payload:', deliveryInfo);
                
                // Skip delivery service since endpoint doesn't exist, go directly to order information
                const orderData = {
                  ...deliveryInfo,
                  selectedMenu,
                  selectedSubscription
                };
                
                console.log('📋 Order data for navigation:', orderData);
                console.log('🚀 Saving order data and navigating...');
                
                await orderStore.saveOrderData(orderData);
                router.push('/(home)/order-information');
              } catch (error) {
                console.log('❌ Navigation error:', error);
                Alert.alert('Error', 'Failed to proceed to order information. Please try again.');
                console.error('Navigation error:', error);
              } finally {
                setSaving(false);
              }
            }}
            className="rounded-xl bg-black py-4 dark:bg-white"
            disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'} />
            ) : (
              <Text
                className="text-center text-lg font-semibold text-white dark:text-black"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Continue to Order
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Information;
