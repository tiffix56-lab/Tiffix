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
import { mapsService } from '@/services/maps.service';
import { orderStore } from '@/utils/order-store';
import * as Location from 'expo-location';

const Information = () => {
  const { colorScheme } = useColorScheme();
  const { subscriptionId, menuId } = useLocalSearchParams();
  
  // Data states
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  
  // Form states
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [lunchTime, setLunchTime] = useState('12:00 PM');
  const [dinnerTime, setDinnerTime] = useState('08:00 PM');
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
      
      // Fetch addresses first
      const addressResponse = await addressService.getAllAddresses();
      
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
      
      // Handle addresses
      if (addressResponse.success && addressResponse.data) {
        const addresses = addressResponse.data.addresses || [];
        // Ensure addresses have proper coordinate format
        const validAddresses = addresses.filter(addr => 
          addr && addr.coordinates && 
          addr.coordinates.latitude !== undefined
        );
        setSavedAddresses(validAddresses);
        const defaultAddress = validAddresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
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

  // Search places using Google Maps Autocomplete
  const searchAddress = async (query: string) => {
    setAddressQuery(query);
    if (query.length < 2) {
      setAddressResults([]);
      return;
    }
    try {
      const results = await mapsService.searchPlaces(query);
      setAddressResults(results);
    } catch (error) {
      console.error('Error searching places:', error);
    }
  };

  // Get current GPS location using Expo Location
  const getCurrentLocation = async () => {
    try {
      const location = await mapsService.getCurrentLocation();
      if (location) {
        setAddressQuery('Getting current location...');
        
        // Use Expo's reverse geocoding (no API key needed)
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addresses.length > 0) {
          const addr = addresses[0];
          const currentAddress: Address = {
            _id: 'current_' + Date.now(),
            label: 'Current Location',
            street: `${addr.streetNumber || ''} ${addr.street || ''}`.trim() || 'Current Location',
            city: addr.city || 'Current Area',
            state: addr.region || 'India',
            zipCode: addr.postalCode || '000000',
            isDefault: false,
            coordinates: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }
          };
          
          setSelectedAddress(currentAddress);
          setAddressQuery(`${currentAddress.street}, ${currentAddress.city}`);
          console.log('📍 Created current location address:', currentAddress);
        } else {
          throw new Error('No address data returned');
        }
      } else {
        Alert.alert('Error', 'Unable to get your current location. Please search manually.');
      }
    } catch (error) {
      setAddressQuery('');
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
      console.error('Location error:', error);
    }
  };

  // Select place from autocomplete results
  const selectAddress = async (result: any) => {
    try {
      const placeDetails = await mapsService.getPlaceDetails(result.place_id);
      if (placeDetails) {
        const address: Address = {
          _id: 'selected_' + Date.now(),
          label: placeDetails.street ? 'Selected Address' : 'Current Location',
          street: placeDetails.street,
          city: placeDetails.city,
          state: placeDetails.state,
          zipCode: placeDetails.zipCode,
          isDefault: false,
          coordinates: placeDetails.coordinates
        };
        setSelectedAddress(address);
        setAddressQuery(result.description);
        setAddressResults([]);
      }
    } catch (error) {
      console.error('Error selecting place:', error);
      Alert.alert('Error', 'Unable to select this location. Please try again.');
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
                            {[address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
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

              {/* Address Search with Autocomplete */}
              <View className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <View className="flex-row items-center">
                  <Feather
                    name="search"
                    size={20}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#6B7280'}
                  />
                  <TextInput
                    className="ml-3 flex-1 text-base text-black dark:text-white"
                    placeholder="Search for delivery address"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={addressQuery}
                    onChangeText={searchAddress}
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                  <TouchableOpacity
                    onPress={getCurrentLocation}
                    className="rounded-full bg-black p-2 dark:bg-white ml-2">
                    <Feather name="navigation" size={16} color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'} />
                  </TouchableOpacity>
                </View>
                
                {/* Search Results */}
                {addressResults.length > 0 && (
                  <View className="mt-3 border-t border-zinc-200 dark:border-zinc-700 pt-3">
                    <ScrollView className="max-h-40">
                      {addressResults.map((result, index) => (
                        <TouchableOpacity
                          key={result.place_id}
                          onPress={() => selectAddress(result)}
                          className="py-2 border-b border-zinc-100 dark:border-zinc-800">
                          <Text
                            className="text-black dark:text-white font-medium"
                            style={{ fontFamily: 'Poppins_500Medium' }}
                            numberOfLines={1}>
                            {result.structured_formatting?.main_text || result.description}
                          </Text>
                          <Text
                            className="text-zinc-500 dark:text-zinc-400 text-sm"
                            style={{ fontFamily: 'Poppins_400Regular' }}
                            numberOfLines={1}>
                            {result.structured_formatting?.secondary_text || ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
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
                          className={`h-5 w-5 rounded-full bg-white transition-transform ${
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
                          className={`h-5 w-5 rounded-full bg-white transition-transform ${
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
      {!loading  && (
        <View className="px-6 pb-6">
          <TouchableOpacity
            onPress={async () => {
              console.log('🚀 Continue to Order button pressed');
              console.log('📍 Selected Address:', selectedAddress);
              console.log('📅 Selected Date:', selectedDate);
              console.log('🍽️ Lunch Enabled:', lunchEnabled, 'Time:', lunchTime);
              console.log('🍽️ Dinner Enabled:', dinnerEnabled, 'Time:', dinnerTime);
              console.log('📋 Subscription ID:', subscriptionId);
              console.log('🍔 Menu ID:', menuId);
              
              // Use selected address (which now includes both saved addresses and searched addresses)
              const deliveryAddress = selectedAddress;

              console.log('📍 Final delivery address:', deliveryAddress);

              if (!deliveryAddress || !selectedDate) {
                console.log('❌ Missing information - Address:', !!deliveryAddress, 'Date:', !!selectedDate);
                Alert.alert('Missing Information', 'Please select an address and delivery date.');
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

              // Validate address coordinates
              if (!deliveryAddress.coordinates || 
                  typeof deliveryAddress.coordinates.latitude !== 'number' || 
                  typeof deliveryAddress.coordinates.longitude !== 'number') {
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
                  deliveryAddress,
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
