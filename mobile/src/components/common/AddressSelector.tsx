import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { router } from 'expo-router';
import { useDefaultAddress } from '@/hooks/useDefaultAddress';

interface AddressSelectorProps {
  showLabel?: boolean;
  compact?: boolean;
  onAddressChange?: (address: any) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  showLabel = true, 
  compact = false,
  onAddressChange 
}) => {
  const { colorScheme } = useColorScheme();
  const [showModal, setShowModal] = useState(false);
  const { 
    primaryAddress, 
    savedAddresses, 
    setSelectedAddress, 
    setAsDefault,
    getFormattedAddress,
    getFullFormattedAddress,
    hasAddresses,
    loading 
  } = useDefaultAddress();

  const handleAddressSelect = (address: any) => {
    setSelectedAddress(address);
    setShowModal(false);
    onAddressChange?.(address);
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="flex-row items-center"
        activeOpacity={0.7}>
        <Feather
          name="map-pin"
          size={16}
          color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
        />
        <Text
          className="ml-1 text-sm font-medium text-black dark:text-white"
          style={{ fontFamily: 'Poppins_500Medium' }}
          numberOfLines={1}>
          {getFormattedAddress()}
        </Text>
        <Feather
          name="chevron-down"
          size={14}
          color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          style={{ marginLeft: 4 }}
        />
        
        {/* Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowModal(false)}>
          <AddressSelectorModal onClose={() => setShowModal(false)} onSelect={handleAddressSelect} />
        </Modal>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      {showLabel && (
        <Text className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300" style={{ fontFamily: 'Poppins_500Medium' }}>
          Delivery Address
        </Text>
      )}
      
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className={`rounded-xl border p-4 ${
          primaryAddress
            ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
            : 'border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800'
        }`}
        activeOpacity={0.7}>
        <View className="flex-row items-center">
          <Feather 
            name="map-pin" 
            size={20} 
            color={primaryAddress ? "#22C55E" : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')} 
          />
          <View className="ml-3 flex-1">
            <Text
              className={`text-base font-medium ${
                primaryAddress 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
              style={{ fontFamily: 'Poppins_500Medium' }}
              numberOfLines={1}>
              {primaryAddress ? getFormattedAddress() : 'Select delivery address'}
            </Text>
            {primaryAddress && (
              <Text
                className="mt-1 text-sm text-green-600 dark:text-green-400"
                style={{ fontFamily: 'Poppins_400Regular' }}
                numberOfLines={2}>
                {getFullFormattedAddress()}
              </Text>
            )}
          </View>
          <Feather 
            name="chevron-down" 
            size={20} 
            color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} 
          />
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}>
        <AddressSelectorModal onClose={() => setShowModal(false)} onSelect={handleAddressSelect} />
      </Modal>
    </View>
  );
};

// Separate modal component to reduce complexity
const AddressSelectorModal: React.FC<{ onClose: () => void; onSelect: (address: any) => void }> = ({ onClose, onSelect }) => {
  const { colorScheme } = useColorScheme();
  const { 
    savedAddresses, 
    selectedAddress, 
    setAsDefault, 
    loading,
    hasAddresses 
  } = useDefaultAddress();

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Modal Header */}
      <View className="px-6 pb-4 pt-16">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-xl font-semibold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Select Delivery Address
          </Text>
          <TouchableOpacity
            onPress={onClose}
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
          {hasAddresses() ? (
            <View>
              <Text
                className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                Your Addresses
              </Text>
              {savedAddresses.map((address, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => onSelect(address)}
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
                        
                        {!address.isDefault && (
                          <TouchableOpacity
                            onPress={() => setAsDefault(address)}
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
              onClose();
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
  );
};

export default AddressSelector;