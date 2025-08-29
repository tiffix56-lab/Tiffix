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
import * as Location from 'expo-location';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addressService } from '@/services/address.service';
import { subscriptionService } from '@/services/subscription.service';
import { menuService } from '@/services/menu.service';
import { Address } from '@/types/address.types';
import { MenuItem } from '@/types/menu.types';
import { Subscription } from '@/services/subscription.service';

const Information = () => {
  const { colorScheme } = useColorScheme();
  const { subscriptionId, menuId } = useLocalSearchParams();
  
  // Data states
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  
  // Form states
  const [currentLocation, setCurrentLocation] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [lunchTime, setLunchTime] = useState('12:00 PM');
  const [dinnerTime, setDinnerTime] = useState('08:00 PM');
  const [lunchEnabled, setLunchEnabled] = useState(false);
  const [dinnerEnabled, setDinnerEnabled] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

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
      
      // Fetch all required data in parallel
      const promises = [
        addressService.getAllAddresses(),
      ];
      
      if (subscriptionId) {
        promises.push(subscriptionService.getSubscriptionById(subscriptionId as string));
      }
      
      if (menuId) {
        promises.push(menuService.getMenuById(menuId as string));
      }
      
      const responses = await Promise.all(promises);
      const [addressResponse, subscriptionResponse, menuResponse] = responses;
      
      // Handle addresses
      if (addressResponse.success && addressResponse.data) {
        setSavedAddresses(addressResponse.data.addresses);
        const defaultAddress = addressResponse.data.addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
      
      // Handle subscription
      if (subscriptionResponse && subscriptionResponse.success && subscriptionResponse.data) {
        setSelectedSubscription(subscriptionResponse.data.subscription);
        // Set default meal timings based on subscription availability
        setLunchEnabled(subscriptionResponse.data.subscription.mealTimings.isLunchAvailable);
        setDinnerEnabled(subscriptionResponse.data.subscription.mealTimings.isDinnerAvailable);
      }
      
      // Handle menu
      if (menuResponse && menuResponse.success && menuResponse.data) {
        setSelectedMenu(menuResponse.data.menu);
      }
      
    } catch (err) {
      setError('Failed to load order data');
      console.error('Error fetching order data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Location permission is required to get your current location.'
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const fullAddress = [
          address.street,
          address.district,
          address.city,
          address.region,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(', ');

        setCurrentLocation(fullAddress);
      } else {
        setCurrentLocation(`${location.coords.latitude}, ${location.coords.longitude}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
      console.error('Location error:', error);
    }
  };

  // Date picker handlers
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
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

  // Time picker handlers
  const onLunchTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowLunchTimePicker(false);
    if (selectedTime) {
      setLunchDateTime(selectedTime);
      const formattedTime = selectedTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setLunchTime(formattedTime);
    }
  };

  const onDinnerTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowDinnerTimePicker(false);
    if (selectedTime) {
      setDinnerDateTime(selectedTime);
      const formattedTime = selectedTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
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
                      onPress={() => setSelectedAddress(address)}
                      className={`mb-3 rounded-xl border p-4 ${
                        selectedAddress === address
                          ? 'border-black bg-black dark:border-white dark:bg-white'
                          : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                      }`}>
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text
                              className={`text-sm font-medium ${
                                selectedAddress === address
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
                              selectedAddress === address
                                ? 'text-zinc-300 dark:text-zinc-700'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {address.street}, {address.city}, {address.state} {address.zipCode}
                          </Text>
                        </View>
                        <View className={`h-5 w-5 rounded-full border-2 ${
                          selectedAddress === address
                            ? 'border-white bg-white dark:border-black dark:bg-black'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}>
                          {selectedAddress === address && (
                            <View className="h-full w-full rounded-full bg-green-500" />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Add New Address */}
              <View className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <View className="flex-row items-center">
                  <Feather
                    name="plus-circle"
                    size={20}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#6B7280'}
                  />
                  <TextInput
                    className="ml-3 flex-1 text-base text-black dark:text-white"
                    placeholder="Add new address"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={newAddress}
                    onChangeText={setNewAddress}
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                </View>
              </View>

              {/* Current Location */}
              <View className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <View className="flex-row items-center">
                  <Feather
                    name="map-pin"
                    size={20}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#6B7280'}
                  />
                  <TextInput
                    className="ml-3 flex-1 text-base text-black dark:text-white"
                    placeholder="Use current location"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={currentLocation}
                    onChangeText={setCurrentLocation}
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                  <TouchableOpacity
                    onPress={getCurrentLocation}
                    className="rounded-full bg-black p-2 dark:bg-white">
                    <Feather name="navigation" size={16} color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'} />
                  </TouchableOpacity>
                </View>
              </View>
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
                      <TouchableOpacity
                        onPress={() => setLunchEnabled(!lunchEnabled)}
                        className={`h-6 w-11 rounded-full ${
                          lunchEnabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}>
                        <View
                          className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            lunchEnabled ? 'translate-x-5' : 'translate-x-0.5'
                          } mt-0.5`}
                        />
                      </TouchableOpacity>
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
                          {lunchTime}
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
                      <TouchableOpacity
                        onPress={() => setDinnerEnabled(!dinnerEnabled)}
                        className={`h-6 w-11 rounded-full ${
                          dinnerEnabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}>
                        <View
                          className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            dinnerEnabled ? 'translate-x-5' : 'translate-x-0.5'
                          } mt-0.5`}
                        />
                      </TouchableOpacity>
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
                          {dinnerTime}
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
          minimumDate={new Date()}
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
      {!loading && selectedAddress && selectedDate && (lunchEnabled || dinnerEnabled) && (
        <View className="px-6 pb-6">
          <TouchableOpacity
            onPress={() => {
              const orderData = {
                menuId: menuId as string,
                subscriptionId: subscriptionId as string,
                selectedMenu,
                selectedSubscription,
                deliveryAddress: selectedAddress,
                deliveryDate: selectedDate,
                lunchTime: lunchEnabled ? lunchTime : '',
                dinnerTime: dinnerEnabled ? dinnerTime : '',
                lunchEnabled,
                dinnerEnabled
              };
              
              router.push({
                pathname: '/order-information',
                params: {
                  orderData: JSON.stringify(orderData)
                }
              });
            }}
            className="rounded-xl bg-black py-4 dark:bg-white">
            <Text
              className="text-center text-lg font-semibold text-white dark:text-black"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Continue to Order
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Information;
