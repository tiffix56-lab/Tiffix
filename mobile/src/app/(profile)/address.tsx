import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { addressService } from '@/services/address.service';
import { Address as AddressType } from '@/types/address.types';
import axios from 'axios';
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
  const [addressSearchResults, setAddressSearchResults] = useState<any[]>([]);
  const [isAddressSearchLoading, setIsAddressSearchLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
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
    if (!GOOGLE_MAPS_API_KEY || query.length < 3) {
      setAddressSearchResults([]);
      return;
    }

    setIsAddressSearchLoading(true);
    try {
      const autocompleteResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input: query,
            key: GOOGLE_MAPS_API_KEY,
            components: 'country:in',
            language: 'en',
          }
        }
      );

      const textSearchResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json`,
        {
          params: {
            query: query + ' India',
            key: GOOGLE_MAPS_API_KEY,
            language: 'en',
          }
        }
      );

      let combinedResults = [];

      if (autocompleteResponse.data.status === 'OK') {
        const autocompleteFormatted = autocompleteResponse.data.predictions.map((prediction: any) => ({
          ...prediction,
          source: 'autocomplete'
        }));
        combinedResults.push(...autocompleteFormatted);
      }

      if (textSearchResponse.data.status === 'OK') {
        const textSearchFormatted = textSearchResponse.data.results.map((place: any) => ({
          place_id: place.place_id,
          structured_formatting: {
            main_text: place.name,
            secondary_text: place.formatted_address
          },
          description: place.formatted_address,
          source: 'textsearch',
          geometry: place.geometry
        }));
        combinedResults.push(...textSearchFormatted);
      }

      const uniqueResults = combinedResults.filter((result, index, self) =>
        index === self.findIndex(r => r.place_id === result.place_id)
      );

      setAddressSearchResults(uniqueResults.slice(0, 10));
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setIsAddressSearchLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string): Promise<any> => {
    if (!GOOGLE_MAPS_API_KEY) return null;

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'geometry,formatted_address,name,address_components',
            key: GOOGLE_MAPS_API_KEY,
          }
        }
      );

      if (response.data.status === 'OK') {
        return response.data.result;
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
    return null;
  };

  const parseAddressComponents = (addressComponents: any[]) => {
    let street = '', city = '', state = '', zipCode = '', country = '';
    
    addressComponents.forEach((component: any) => {
      if (component.types.includes('street_number') || component.types.includes('route')) {
        street += component.long_name + ' ';
      }
      if (component.types.includes('locality') || component.types.includes('sublocality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (component.types.includes('postal_code')) {
        zipCode = component.long_name;
      }
      if (component.types.includes('country')) {
        country = component.short_name;
      }
    });

    return {
      street: street.trim(),
      city,
      state,
      zipCode,
      country
    };
  };

  const handleAddressSelect = async (prediction?: any): Promise<void> => {
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

        if (addresses.length > 0) {
          const addr = addresses[0];
          setNewAddress(prev => ({
            ...prev,
            street: `${addr.streetNumber || ''} ${addr.street || ''}`.trim() || 'Current Location',
            city: addr.city || 'Current Area',
            state: addr.region || 'India',
            zipCode: addr.postalCode || '',
            coordinates: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }
          }));
          setSelectedPlace({ description: 'Current Location' });
        }
      } catch (error) {
        Alert.alert('Error', 'Unable to get current location');
      }
    } else {
      if (prediction.geometry && prediction.geometry.location) {
        const { lat, lng } = prediction.geometry.location;
        const addressComponents = prediction.address_components || [];
        const parsed = parseAddressComponents(addressComponents);
        
        if (parsed.country !== 'IN') {
          Alert.alert('Location Not Supported', 'Currently, we only deliver to addresses in India.');
          return;
        }

        setNewAddress(prev => ({
          ...prev,
          street: parsed.street || prediction.description,
          city: parsed.city,
          state: parsed.state,
          zipCode: parsed.zipCode,
          coordinates: { latitude: lat, longitude: lng }
        }));
        setSelectedPlace(prediction);
      } else {
        const placeDetails = await getPlaceDetails(prediction.place_id);
        if (placeDetails) {
          const parsed = parseAddressComponents(placeDetails.address_components || []);
          
          if (parsed.country !== 'IN') {
            Alert.alert('Location Not Supported', 'Currently, we only deliver to addresses in India.');
            return;
          }

          setNewAddress(prev => ({
            ...prev,
            street: parsed.street || placeDetails.formatted_address,
            city: parsed.city,
            state: parsed.state,
            zipCode: parsed.zipCode,
            coordinates: {
              latitude: placeDetails.geometry.location.lat,
              longitude: placeDetails.geometry.location.lng
            }
          }));
          setSelectedPlace(prediction);
        }
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
                        {selectedPlace ? selectedPlace.description : 'Search for your address'}
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
                          {address && [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
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