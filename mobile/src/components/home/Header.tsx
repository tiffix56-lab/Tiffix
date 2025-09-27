import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import ThemeToggle from '../ui/ThemeToggle';
import { useDefaultAddress } from '@/hooks/useDefaultAddress';
import LocationPicker from '../common/LocationPicker';
import { router } from 'expo-router';
import { Address } from '@/types/address.types';

const Header = () => {
  const { colorScheme } = useColorScheme();
  const { 
    selectedAddress, 
    savedAddresses, 
    defaultAddress, 
    setSelectedAddress, 
    loading, 
    setAsDefault,
    getFormattedAddress,
    hasAddresses
  } = useDefaultAddress();
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Debug logging
  console.log('🏠 [HEADER] Address state:', {
    selectedAddress: selectedAddress?.label || 'null',
    defaultAddress: defaultAddress?.label || 'null',
    savedAddressesCount: savedAddresses.length,
    hasAddresses: hasAddresses(),
    loading
  });

  const currentLocation = getFormattedAddress() === 'No address selected' 
    ? (hasAddresses() ? 'Select Address' : 'Add Address')
    : getFormattedAddress();

  const truncateLocation = (location: string, maxLength: number = 25) => {
    if (location.length <= maxLength) return location;
    return location.substring(0, maxLength) + '...';
  };

  return (
    <View className="px-6 pb-6 pt-16">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity 
          className="flex-1 flex-row items-center" 
          activeOpacity={0.7}
          onPress={() => setShowAddressModal(true)}>
          <Feather
            name="map-pin"
            size={18}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          />
          <Text
            className="ml-2 text-sm font-medium text-black dark:text-white"
            style={{ fontFamily: 'Poppins_500Medium' }}
            numberOfLines={1}>
            {truncateLocation(currentLocation)}
          </Text>
          <Feather
            name="chevron-down"
            size={16}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        <View className="flex-row items-center space-x-3">
          <TouchableOpacity className="p-2">
            <Feather name="bell" size={22} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <ThemeToggle />
        </View>
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressModal(false)}>
        <View className="flex-1 bg-white dark:bg-black">
          {/* Modal Header */}
          <View className="px-6 pb-4 pt-16">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Select Address
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddressModal(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Feather name="x" size={20} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal Content */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              <Text className="mt-4 text-base text-zinc-500 dark:text-zinc-400">Loading addresses...</Text>
            </View>
          ) : (
            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
              {/* Current Location Button */}
              <TouchableOpacity
                onPress={() => {
                  setShowAddressModal(false);
                  // TODO: Get current location and add to addresses
                }}
                className="mb-4 flex-row items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50 p-4 dark:border-blue-600 dark:bg-blue-900/20">
                <Feather name="crosshair" size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                <Text
                  className="ml-2 text-base font-medium text-blue-600 dark:text-blue-400"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Use Current Location
                </Text>
              </TouchableOpacity>

              {/* Saved Addresses */}
              {savedAddresses.length > 0 ? (
                <View>
                  <Text
                    className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Saved Addresses
                  </Text>
                  {savedAddresses.map((address, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setSelectedAddress(address);
                        setShowAddressModal(false);
                      }}
                      className={`mb-4 rounded-xl border p-4 ${
                        selectedAddress?.label === address.label
                          ? 'border-black bg-black dark:border-white dark:bg-white'
                          : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                      }`}>
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
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
                            
                            {/* Set as Default Button */}
                            {!address.isDefault && (
                              <TouchableOpacity
                                onPress={() => {
                                  setAsDefault(address);
                                }}
                                className="ml-2 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1"
                                activeOpacity={0.7}>
                                <Text
                                  className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
                                  style={{ fontFamily: 'Poppins_500Medium' }}>
                                  Set Default
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text
                            className={`mt-1 text-sm ${
                              selectedAddress?.label === address.label
                                ? 'text-zinc-300 dark:text-zinc-700'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {[address.street, address.city, address.state].filter(Boolean).join(', ')}
                          </Text>
                        </View>
                        <View className={`ml-3 h-5 w-5 rounded-full border-2 ${
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
              ) : (
                <View className="items-center py-8">
                  <Feather name="map-pin" size={48} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                  <Text
                    className="mt-4 text-center text-base font-medium text-zinc-600 dark:text-zinc-300"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    No saved addresses
                  </Text>
                  <Text
                    className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Add an address to get started
                  </Text>
                </View>
              )}

              {/* Add New Address Button */}
              <TouchableOpacity
                onPress={() => {
                  setShowAddressModal(false);
                  router.push('/(profile)/address');
                }}
                className="mb-6 mt-4 flex-row items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-900">
                <Feather name="plus" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text
                  className="ml-2 text-base font-medium text-zinc-600 dark:text-zinc-300"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Add New Address
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default Header;
