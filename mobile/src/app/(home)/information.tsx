import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as Location from 'expo-location';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const Information = () => {
  const { colorScheme } = useColorScheme();
  const [currentLocation, setCurrentLocation] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [alternativeAddress, setAlternativeAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [lunchTime, setLunchTime] = useState('12:00 PM');
  const [dinnerTime, setDinnerTime] = useState('08:00 PM');

  // Date and Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLunchTimePicker, setShowLunchTimePicker] = useState(false);
  const [showDinnerTimePicker, setShowDinnerTimePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [lunchDateTime, setLunchDateTime] = useState(new Date());
  const [dinnerDateTime, setDinnerDateTime] = useState(new Date());

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
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          <View className="mb-8">
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
                  placeholder="Current location"
                  placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  value={currentLocation}
                  onChangeText={setCurrentLocation}
                  style={{ fontFamily: 'Poppins_400Regular' }}
                />
                <TouchableOpacity
                  onPress={getCurrentLocation}
                  className="rounded-full bg-black p-4">
                  <Feather name="navigation" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

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

            {/* Alternative Address */}
            <View className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <View className="flex-row items-center">
                <Feather
                  name="home"
                  size={20}
                  color={colorScheme === 'dark' ? '#FFFFFF' : '#6B7280'}
                />
                <TextInput
                  className="ml-3 flex-1 text-base text-black dark:text-white"
                  placeholder="Alternative address (optional)"
                  placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  value={alternativeAddress}
                  onChangeText={setAlternativeAddress}
                  style={{ fontFamily: 'Poppins_400Regular' }}
                />
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
                <View className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <Text
                    className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Lunch Delivery Time
                  </Text>
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
                </View>

                {/* Dinner Time */}
                <View className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <Text
                    className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Dinner Delivery Time
                  </Text>
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
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
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
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={() => router.push('/order-information')}
          className="rounded-xl bg-black py-4 dark:bg-white">
          <Text
            className="text-center text-lg font-semibold text-white dark:text-black"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Continue to Order
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Information;
