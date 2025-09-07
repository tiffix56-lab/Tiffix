import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { addressService } from '@/services/address.service';
import { Address as AddressType } from '@/types/address.types';
import { mapsService, AutocompleteResult, ParsedAddress } from '@/services/maps.service';
import * as Location from 'expo-location';

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
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState<AutocompleteResult[]>([]);
  const [isAddressSearchLoading, setIsAddressSearchLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<ParsedAddress | null>(null);
  const [sessionToken] = useState(() => mapsService.generateSessionToken());

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

  const searchAddressPlaces = async (query: string): Promise<void> => {
    if (query.length < 2) {
      setAddressSearchResults([]);
      return;
    }

    setIsAddressSearchLoading(true);
    try {
      console.log('🔍 Searching places with Ola Maps:', query);
      const results = await mapsService.searchPlaces(query, sessionToken);
      console.log('📍 Search results:', results);
      setAddressSearchResults(results.slice(0, 10));
    } catch (error) {
      console.error('Error searching places with Ola Maps:', error);
      setAddressSearchResults([]);
    } finally {
      setIsAddressSearchLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string): Promise<ParsedAddress | null> => {
    try {
      console.log('📍 Getting place details with Ola Maps:', placeId);
      const result = await mapsService.getPlaceDetails(placeId, sessionToken);
      console.log('🏠 Place details result:', result);
      return result;
    } catch (error) {
      console.error('Error getting place details from Ola Maps:', error);
      return null;
    }
  };

  const handleAddressSelect = async (prediction?: AutocompleteResult): Promise<void> => {
    if (!prediction) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to get current location');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Try to reverse geocode the location
        const address = await mapsService.reverseGeocode(location.coords.latitude, location.coords.longitude);
        
        if (address) {
          setNewAddress(prev => ({
            ...prev,
            street: address.street || 'Current Location',
            city: address.city || 'Current Area',
            state: address.state || 'India',
            zipCode: address.zipCode || '',
            coordinates: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }
          }));
          setSelectedPlace(address);
        } else {
          // Fallback to Expo reverse geocoding
          const addresses = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (addresses.length > 0) {
            const addr = addresses[0];
            const fallbackAddress: ParsedAddress = {
              street: `${addr.streetNumber || ''} ${addr.street || ''}`.trim() || 'Current Location',
              city: addr.city || 'Current Area',
              state: addr.region || 'India',
              zipCode: addr.postalCode || '',
              country: addr.country || 'IN',
              fullAddress: [addr.streetNumber, addr.street, addr.city, addr.region, addr.postalCode].filter(Boolean).join(', '),
              coordinates: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              }
            };
            
            setNewAddress(prev => ({
              ...prev,
              street: fallbackAddress.street,
              city: fallbackAddress.city,
              state: fallbackAddress.state,
              zipCode: fallbackAddress.zipCode,
              coordinates: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              }
            }));
            setSelectedPlace(fallbackAddress);
          }
        }
      } catch (error) {
        console.error('Error getting current location:', error);
        Alert.alert('Error', 'Unable to get current location');
      }
    } else {
      // Get place details from Ola Maps
      const placeDetails = await getPlaceDetails(prediction.place_id);
      if (placeDetails) {
        // Check if it's in India
        if (placeDetails.country && placeDetails.country !== 'IN') {
          Alert.alert('Location Not Supported', 'Currently, we only deliver to addresses in India.');
          return;
        }

        setNewAddress(prev => ({
          ...prev,
          street: placeDetails.street || placeDetails.fullAddress,
          city: placeDetails.city,
          state: placeDetails.state,
          zipCode: placeDetails.zipCode,
          coordinates: {
            latitude: placeDetails.coordinates.latitude,
            longitude: placeDetails.coordinates.longitude
          }
        }));
        setSelectedPlace(placeDetails);
      } else {
        Alert.alert('Error', 'Unable to get address details. Please try another location.');
        return;
      }
    }

    setShowAddressSearch(false);
    setAddressSearchQuery('');
    setAddressSearchResults([]);
  };

  const handleAddAddress = async () => {
    if (!newAddress.label.trim()) {
      Alert.alert('Error', 'Please enter an address label');
      return;
    }

    if (!selectedPlace || !newAddress.street.trim() || !newAddress.city.trim() || !newAddress.state.trim()) {
      Alert.alert('Error', 'Please select an address from the suggestions');
      return;
    }

    if (!newAddress.coordinates || newAddress.coordinates.latitude === 0 || newAddress.coordinates.longitude === 0) {
      Alert.alert('Error', 'Invalid address coordinates. Please select again.');
      return;
    }

    if (newAddress.zipCode && !/^[0-9]{6}$/.test(newAddress.zipCode)) {
      Alert.alert('Error', 'Please select an address with a valid 6-digit Indian pincode');
      return;
    }

    try {
      setAdding(true);
      const addressPayload = {
        ...newAddress,
        coordinates: {
          latitude: newAddress.coordinates.latitude,
          longitude: newAddress.coordinates.longitude
        }
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
        setSelectedPlace(null);
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
                  
                  <TouchableOpacity
                    onPress={() => setShowAddressSearch(!showAddressSearch)}
                    className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-600 dark:bg-zinc-800">
                    <View className="flex-row items-center">
                      <Feather name="search" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                      <Text
                        className={`ml-3 flex-1 text-base ${
                          selectedPlace 
                            ? 'text-black dark:text-white' 
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                        style={{ fontFamily: 'Poppins_400Regular' }}>
                        {selectedPlace ? selectedPlace.fullAddress || selectedPlace.street : 'Search for your address'}
                      </Text>
                      <Feather name="chevron-down" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    </View>
                  </TouchableOpacity>

                  {showAddressSearch && (
                    <View className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800 max-h-80">
                      <View className="flex-row items-center border-b border-zinc-200 p-3 dark:border-zinc-600">
                        <Feather name="search" size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        <TextInput
                          className="ml-3 flex-1 text-black dark:text-white"
                          placeholder="Search for area, street name..."
                          placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                          value={addressSearchQuery}
                          onChangeText={(text) => {
                            setAddressSearchQuery(text);
                            searchAddressPlaces(text);
                          }}
                          autoFocus={true}
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        />
                        {isAddressSearchLoading && (
                          <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
                        )}
                      </View>

                      <ScrollView className="max-h-52" showsVerticalScrollIndicator={false}>
                        <TouchableOpacity
                          onPress={() => handleAddressSelect()}
                          className="flex-row items-center border-b border-zinc-100 p-3 dark:border-zinc-700">
                          <View className="h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <Feather name="navigation" size={16} color="#22C55E" />
                          </View>
                          <View className="ml-3 flex-1">
                            <Text className="text-sm font-medium text-green-600 dark:text-green-400" style={{ fontFamily: 'Poppins_500Medium' }}>
                              Use Current Location
                            </Text>
                            <Text className="text-xs text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                              Using GPS
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {addressSearchResults.map((prediction, index) => (
                          <TouchableOpacity
                            key={prediction.place_id || index}
                            onPress={() => handleAddressSelect(prediction)}
                            className={`flex-row items-center p-3 ${
                              index < addressSearchResults.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-700' : ''
                            }`}>
                            <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                              <Feather name="map-pin" size={16} color="#3B82F6" />
                            </View>
                            <View className="ml-3 flex-1">
                              <Text className="text-sm font-medium text-black dark:text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                                {prediction.structured_formatting?.main_text || prediction.description}
                              </Text>
                              <Text className="text-xs text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                                {prediction.structured_formatting?.secondary_text || ''}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}

                        {addressSearchQuery.length > 2 && addressSearchResults.length === 0 && !isAddressSearchLoading && (
                          <View className="items-center py-6">
                            <Text className="text-sm text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                              No locations found
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {selectedPlace && (
                    <View className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-600 dark:bg-green-900/20">
                      <Text className="text-sm font-medium text-green-700 dark:text-green-400" style={{ fontFamily: 'Poppins_500Medium' }}>
                        Selected Address:
                      </Text>
                      <Text className="text-sm text-green-600 dark:text-green-300" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {[newAddress.street, newAddress.city, newAddress.state, newAddress.zipCode].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  )}

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
                <View className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                  <Feather name="map-pin" size={32} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                </View>
                <Text 
                  className="mt-6 text-center text-xl font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No addresses yet
                </Text>
                <Text 
                  className="mt-2 text-center text-base text-zinc-500 dark:text-zinc-400 px-8"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  Add your delivery addresses to make ordering faster and easier
                </Text>
                {!showAddForm && (
                  <TouchableOpacity 
                    onPress={() => setShowAddForm(true)}
                    className="mt-6 rounded-xl bg-black px-8 py-4 dark:bg-white"
                  >
                    <View className="flex-row items-center">
                      <Feather name="plus" size={20} color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'} />
                      <Text 
                        className="ml-2 text-base font-semibold text-white dark:text-black"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Add Your First Address
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="space-y-3">
                {Array.isArray(addresses) && addresses.map((address, index) => (
                  <View key={index} className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <View className="mr-3">
                            <Feather 
                              name={address.label.toLowerCase().includes('home') ? 'home' : 
                                    address.label.toLowerCase().includes('office') || address.label.toLowerCase().includes('work') ? 'briefcase' : 
                                    'map-pin'} 
                              size={18} 
                              color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                            />
                          </View>
                          <Text
                            className="text-lg font-semibold text-black dark:text-white"
                            style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            {address.label}
                          </Text>
                          {address.isDefault && (
                            <View className="ml-2 rounded-full bg-green-100 dark:bg-green-900 px-3 py-1">
                              <Text
                                className="text-xs font-medium text-green-700 dark:text-green-300"
                                style={{ fontFamily: 'Poppins_500Medium' }}>
                                Default
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          className="text-sm text-gray-600 dark:text-gray-300 leading-5"
                          style={{ fontFamily: 'Poppins_400Regular' }}>
                          {address && [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteAddress(index)}
                        disabled={deleting === index}
                        className="ml-3 rounded-full bg-red-50 p-2 dark:bg-red-900/30">
                        {deleting === index ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Add another address button for existing addresses */}
                {!showAddForm && (
                  <TouchableOpacity
                    onPress={() => setShowAddForm(true)}
                    className="mt-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 py-6">
                    <View className="flex-row items-center justify-center">
                      <Feather name="plus" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                      <Text
                        className="ml-2 text-base font-medium text-gray-600 dark:text-gray-400"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        Add Another Address
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

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