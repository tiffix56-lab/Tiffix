import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { addressService } from '@/services/address.service';
import { Address as AddressType } from '@/types/address.types';

const Address = () => {
  console.log('🏠 Address component mounted');
  
  const { colorScheme } = useColorScheme();
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
    coordinates: { latitude: 0, longitude: 0 }
  });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    console.log('🔄 useEffect triggered - calling fetchAddresses');
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      console.log('🔄 Fetching addresses...');
      setLoading(true);
      const response = await addressService.getAllAddresses();
      
      console.log('📡 Address service response:', response);
      
      if (response.success && response.data && response.data.addresses) {
        const addresses = response.data.addresses || [];
        console.log('📍 Raw addresses:', addresses);
        
        // Filter out addresses with invalid data
        const validAddresses = Array.isArray(addresses) ? addresses.filter(addr => 
          addr && addr.label && addr.street
        ) : [];
        console.log('✅ Valid addresses:', validAddresses);
        setAddresses(validAddresses);
      } else {
        console.log('❌ Failed to load addresses:', response.message);
        setAddresses([]); // Set empty array instead of showing error for new users
        setError('');
      }
    } catch (err) {
      console.log('❌ Address fetch error:', err);
      setError('Failed to load addresses');
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.label.trim() || !newAddress.street.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.zipCode.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      setAdding(true);
      const addressPayload = {
        ...newAddress,
        coordinates: newAddress.coordinates
      };
      const response = await addressService.addAddress(addressPayload);
      
      if (response.success) {
        Alert.alert('Success', 'Address added successfully');
        setShowAddForm(false);
        setNewAddress({
          label: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          isDefault: false,
          coordinates: { latitude: 0, longitude: 0 }
        });
        fetchAddresses();
      } else {
        Alert.alert('Error', response.message || 'Failed to add address');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add address');
      console.error('Error adding address:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAddress = async (index: number) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(index);
              const response = await addressService.deleteAddress(index);
              
              if (response.success) {
                Alert.alert('Success', 'Address deleted successfully');
                fetchAddresses();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete address');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete address');
              console.error('Error deleting address:', err);
            } finally {
              setDeleting(null);
            }
          }
        }
      ]
    );
  };

  const handlePlaceSelect = (data: any, details: any) => {
    console.log('📍 Place selected:', data);
    console.log('📍 Place details:', details);
    
    if (details) {
      const addressComponents = details.address_components;
      let street = '', city = '', state = '', zipCode = '', country = '';
      
      addressComponents.forEach((component: any) => {
        if (component.types.includes('street_number') || component.types.includes('route')) {
          street += component.long_name + ' ';
        }
        if (component.types.includes('locality') || component.types.includes('sublocality')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          zipCode = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.short_name;
        }
      });

      // Validate Indian address
      if (country !== 'IN') {
        Alert.alert('Location Not Supported', 'Currently, we only deliver to addresses in India. Please select an Indian address.');
        return;
      }

      if (!zipCode || !/^[0-9]{6}$/.test(zipCode)) {
        Alert.alert('Invalid Address', 'Please select an address with a valid 6-digit Indian pincode.');
        return;
      }

      setNewAddress(prev => ({
        ...prev,
        street: street.trim() || details.formatted_address,
        city: city || 'Unknown City',
        state: state || 'Unknown State',
        zipCode: zipCode,
        coordinates: {
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng
        }
      }));
      console.log('✅ Valid Indian address set');
    }
  };

  try {
    console.log('🎨 Rendering Address component');
    console.log('📊 Current state:', { 
      loading, 
      addressesCount: addresses?.length || 0, 
      error, 
      showAddForm 
    });

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
              My Addresses
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
            <Feather
              name={showAddForm ? "x" : "plus"}
              size={20}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
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
            {/* Add New Address Form */}
            {showAddForm && (
              <View className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
                <Text
                  className="mb-4 text-lg font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Add New Address
                </Text>
                
                <View className="space-y-4">
                  <TextInput
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="Address Label (e.g., Home, Office)"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={newAddress.label}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, label: text }))}
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                  
                  <TextInput
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="Enter your full address"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={newAddress.street}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, street: text }))}
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                  
                  <View className="flex-row space-x-2">
                    <TextInput
                      className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                      placeholder="City"
                      placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                      value={newAddress.city}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, city: text }))}
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    />
                    <TextInput
                      className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                      placeholder="State"
                      placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                      value={newAddress.state}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, state: text }))}
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    />
                  </View>
                  
                  <TextInput
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="ZIP Code"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={newAddress.zipCode}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, zipCode: text }))}
                    keyboardType="numeric"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />

                  <TouchableOpacity
                    onPress={() => setNewAddress(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                    className="flex-row items-center">
                    <View className={`h-5 w-5 rounded border-2 ${
                      newAddress.isDefault 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}>
                      {newAddress.isDefault && (
                        <Feather name="check" size={12} color="#FFFFFF" />
                      )}
                    </View>
                    <Text
                      className="ml-3 text-sm text-black dark:text-white"
                      style={{ fontFamily: 'Poppins_400Regular' }}>
                      Set as default address
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="mt-6 flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => setShowAddForm(false)}
                    className="flex-1 rounded-lg border border-zinc-200 py-3 dark:border-zinc-600">
                    <Text
                      className="text-center text-base font-medium text-black dark:text-white"
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddAddress}
                    disabled={adding}
                    className={`flex-1 rounded-lg py-3 ${
                      adding ? 'bg-zinc-400 dark:bg-zinc-600' : 'bg-black dark:bg-white'
                    }`}>
                    {adding ? (
                      <View className="flex-row items-center justify-center">
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text
                          className="ml-2 text-center text-base font-medium text-white"
                          style={{ fontFamily: 'Poppins_500Medium' }}>
                          Adding...
                        </Text>
                      </View>
                    ) : (
                      <Text
                        className="text-center text-base font-medium text-white dark:text-black"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        Add Address
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Address List */}
            {!addresses || addresses.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Feather name="map-pin" size={48} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                <Text className="mt-4 text-center text-lg font-medium text-zinc-600 dark:text-zinc-300">
                  No addresses found
                </Text>
                <Text className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Add your first address to get started
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowAddForm(true)}
                  className="mt-4 rounded-xl bg-black px-6 py-3 dark:bg-white"
                >
                  <Text className="text-white font-medium dark:text-black">Add Address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="space-y-4">
                {Array.isArray(addresses) && addresses.map((address, index) => (
                  <View key={index} className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-800">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text
                            className="text-base font-semibold text-black dark:text-white"
                            style={{ fontFamily: 'Poppins_600SemiBold' }}>
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
                          className="mt-1 text-sm text-gray-600 dark:text-gray-300"
                          style={{ fontFamily: 'Poppins_400Regular' }}>
                          {[address?.street, address?.city, address?.state, address?.zipCode].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteAddress(index)}
                        disabled={deleting === index}
                        className="ml-4 rounded-full bg-red-50 p-2 dark:bg-red-900">
                        {deleting === index ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Add Address Button */}
            <View className="px-6 py-4">
              <TouchableOpacity
                onPress={() => setShowAddForm(true)}
                className="flex-row items-center justify-center rounded-xl bg-black py-4 dark:bg-white">
                <Feather name="plus" size={20} color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'} />
                <Text
                  className="ml-2 text-lg font-semibold text-white dark:text-black"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Add New Address
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Spacing */}
            <View className="h-20" />
          </ScrollView>
        )}
      </View>

    </View>
  );
  } catch (renderError) {
    console.log('💥 Address component render error:', renderError);
    console.error('Address component crash:', renderError);
    
    return (
      <View className="flex-1 bg-zinc-50 dark:bg-neutral-900 items-center justify-center">
        <Text className="text-red-500 text-center p-4">
          Error loading addresses. Please try again.
        </Text>
        <TouchableOpacity 
          onPress={() => {
            console.log('🔄 Retry button pressed');
            fetchAddresses();
          }}
          className="mt-4 bg-black px-6 py-3 rounded-xl">
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
};

export default Address;