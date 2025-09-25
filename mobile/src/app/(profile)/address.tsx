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
  const [sessionToken, setSessionToken] = useState<string>('');

  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    console.log('🔄 useEffect triggered - calling fetchAddresses');
    fetchAddresses();
  }, []);

  useEffect(() => {
    const initializeSessionToken = async () => {
      try {
        const token = await mapsService.generateSessionToken();
        setSessionToken(token);
      } catch (error) {
        console.error('Failed to generate session token:', error);
      }
    };
    
    initializeSessionToken();
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
      const results = await mapsService.searchPlaces(query, sessionToken || undefined);
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
      const result = await mapsService.getPlaceDetails(placeId, sessionToken || undefined);
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
        console.log('📍 [ADDRESS] Starting current location fetch...');
        
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('📍 [ADDRESS] Permission status:', status);
        
        if (status !== 'granted') {
          console.log('❌ [ADDRESS] Permission denied');
          Alert.alert(
            'Permission Required', 
            'Location permission is required to get your current location. Please enable location access in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Location.enableNetworkProviderAsync() }
            ]
          );
          return;
        }

        // Check if location services are enabled
        const hasLocationServices = await Location.hasServicesEnabledAsync();
        if (!hasLocationServices) {
          console.log('❌ [ADDRESS] Location services disabled');
          Alert.alert(
            'Location Services Disabled', 
            'Please enable location services in your device settings to use current location.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Enable', onPress: () => Location.enableNetworkProviderAsync() }
            ]
          );
          return;
        }

        console.log('📍 [ADDRESS] Getting current position...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 15000, // 15 seconds timeout
          maximumAge: 10000 // Accept location up to 10 seconds old
        });

        console.log('📍 [ADDRESS] Current location obtained:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy
        });

        // Use Expo reverse geocoding as primary method (more reliable)
        console.log('🗺️ [ADDRESS] Using Expo reverse geocoding as primary method...');
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addresses.length > 0) {
          const addr = addresses[0];
          console.log('✅ [ADDRESS] Expo reverse geocoding successful:', addr);
          
          const expoAddress: ParsedAddress = {
            street: `${addr.streetNumber || ''} ${addr.street || ''}`.trim() || 'Current Location',
            city: addr.city || addr.district || addr.subregion || 'Current Area',
            state: addr.region || addr.administrativeArea || 'India',
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
            street: expoAddress.street,
            city: expoAddress.city,
            state: expoAddress.state,
            zipCode: expoAddress.zipCode,
            coordinates: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }
          }));
          setSelectedPlace(expoAddress);
          setShowAddressSearch(false);
          setAddressSearchQuery('');
          setAddressSearchResults([]);
          Alert.alert('Success', 'Current location detected successfully!');
        } else {
          console.log('⚠️ [ADDRESS] Expo reverse geocoding failed, trying maps service fallback...');
          
          // Try maps service as fallback
          try {
            const address = await mapsService.reverseGeocode(location.coords.latitude, location.coords.longitude);
            
            if (address && address.street && address.city) {
              console.log('✅ [ADDRESS] Maps service fallback successful:', address);
              setNewAddress(prev => ({
                ...prev,
                street: address.street,
                city: address.city,
                state: address.state || 'India',
                zipCode: address.zipCode || '',
                coordinates: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude
                }
              }));
              setSelectedPlace(address);
              setShowAddressSearch(false);
              setAddressSearchQuery('');
              setAddressSearchResults([]);
              Alert.alert('Success', 'Current location detected successfully!');
            } else {
              throw new Error('Maps service returned no results');
            }
          } catch (mapsError) {
            console.log('❌ [ADDRESS] All reverse geocoding methods failed, using coordinates only');
            // Last fallback - use coordinates only
            const basicAddress: ParsedAddress = {
              street: `Location (${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)})`,
              city: 'Current Area',
              state: 'India',
              zipCode: '',
              country: 'IN',
              fullAddress: `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`,
              coordinates: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              }
            };
            
            setNewAddress(prev => ({
              ...prev,
              street: basicAddress.street,
              city: basicAddress.city,
              state: basicAddress.state,
              zipCode: basicAddress.zipCode,
              coordinates: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              }
            }));
            setSelectedPlace(basicAddress);
            setShowAddressSearch(false);
            setAddressSearchQuery('');
            setAddressSearchResults([]);
            Alert.alert('Location Detected', 'Location coordinates detected. You may need to manually enter the full address details.');
          }
        }

      } catch (error) {
        console.error('❌ [ADDRESS] Error getting current location:', error);
        
        let errorMessage = 'Unable to get current location. ';
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorMessage += 'Location request timed out. Please ensure you have a clear view of the sky and good GPS signal.';
          } else if (error.message.includes('denied')) {
            errorMessage += 'Location access was denied. Please enable location permissions in settings.';
          } else if (error.message.includes('unavailable')) {
            errorMessage += 'Location services are currently unavailable. Please try again later.';
          } else {
            errorMessage += 'Please try again or enter your address manually.';
          }
        } else {
          errorMessage += 'Please try again or enter your address manually.';
        }
        
        Alert.alert('Location Error', errorMessage);
      }
    } else {
      // Get place details from Ola Maps
      const placeDetails = await getPlaceDetails(prediction.place_id);
      if (placeDetails) {
        // Check if it's in India (handle both ISO code 'IN' and full name 'India')
        if (placeDetails.country && !['IN', 'India'].includes(placeDetails.country)) {
          console.log('❌ Country not supported:', placeDetails.country);
          Alert.alert('Location Not Supported', 'Currently, we only deliver to addresses in India.');
          return;
        }
        console.log('✅ Country validation passed:', placeDetails.country);

        setNewAddress(prev => {
          const updatedAddress = {
            ...prev,
            street: placeDetails.street || placeDetails.fullAddress,
            city: placeDetails.city,
            state: placeDetails.state,
            zipCode: placeDetails.zipCode,
            coordinates: {
              latitude: placeDetails.coordinates.latitude,
              longitude: placeDetails.coordinates.longitude
            }
          };
          console.log('🏠 Setting address from place details:', updatedAddress);
          return updatedAddress;
        });
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

    // Validate pincode if present
    if (newAddress.zipCode) {
      const cleanedZipCode = newAddress.zipCode.replace(/\s+/g, '').trim();
      if (!/^[0-9]{6}$/.test(cleanedZipCode)) {
        console.log('❌ Invalid pincode:', newAddress.zipCode, 'cleaned:', cleanedZipCode);
        Alert.alert('Error', 'Please select an address with a valid 6-digit Indian pincode');
        return;
      }
      // Update with cleaned zipcode
      newAddress.zipCode = cleanedZipCode;
    } else {
      console.log('⚠️ No pincode provided, but continuing...');
    }
    
    console.log('✅ Address validation passed:', newAddress);

    try {
      setAdding(true);
      const addressPayload = {
        ...newAddress,
        coordinates: {
          latitude: newAddress.coordinates.latitude,
          longitude: newAddress.coordinates.longitude
        }
      };
      console.log('📤 Sending address payload:', addressPayload);
      const response = await addressService.addAddress(addressPayload);
      console.log('📥 Backend response:', response);
      
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
        console.log('❌ Backend error:', response.message);
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
                
                <View className="gap-4">
                  {/* Address Label Input */}
                  <View>
                    <Text className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Address Label *
                    </Text>
                    <TextInput
                      className={`rounded-xl border bg-white px-4 py-4 text-black dark:bg-zinc-800 dark:text-white ${
                        !newAddress.label.trim() && newAddress.label !== ''
                          ? 'border-red-300 dark:border-red-600'
                          : 'border-zinc-200 dark:border-zinc-600 focus:border-blue-500 dark:focus:border-blue-400'
                      }`}
                      placeholder="e.g., Home, Office, Mom's Place"
                      placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                      value={newAddress.label}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, label: text }))}
                      style={{ fontFamily: 'Poppins_400Regular', fontSize: 16 }}
                      maxLength={50}
                    />
                  </View>
                  
                  {/* Address Search */}
                  <View>
                    <Text className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Address Location *
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAddressSearch(!showAddressSearch)}
                      className={`rounded-xl border p-4 transition-colors ${
                        selectedPlace
                          ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                          : 'border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800'
                      }`}
                      activeOpacity={0.7}>
                    <View className="flex-row items-center">
                      <Feather 
                        name={selectedPlace ? "map-pin" : "search"} 
                        size={20} 
                        color={
                          selectedPlace 
                            ? "#22C55E" 
                            : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')
                        } 
                      />
                      <Text
                        className={`ml-3 flex-1 text-base ${
                          selectedPlace 
                            ? 'text-green-700 dark:text-green-300 font-medium' 
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                        style={{ fontFamily: selectedPlace ? 'Poppins_500Medium' : 'Poppins_400Regular' }}
                        numberOfLines={2}>
                        {selectedPlace ? selectedPlace.fullAddress || selectedPlace.street : 'Search for your address or use current location'}
                      </Text>
                      <Feather 
                        name={showAddressSearch ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                      />
                    </View>
                    {selectedPlace && (
                      <View className="mt-2 flex-row items-center">
                        <Feather name="check-circle" size={16} color="#22C55E" />
                        <Text className="ml-2 text-sm text-green-600 dark:text-green-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                          Address selected
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {showAddressSearch && (
                    <View className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800 max-h-80 shadow-lg">
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
                        <TouchableOpacity
                          onPress={() => {
                            setShowAddressSearch(false);
                            setAddressSearchQuery('');
                            setAddressSearchResults([]);
                          }}
                          className="ml-2 p-1">
                          <Feather name="x" size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        </TouchableOpacity>
                      </View>

                      <ScrollView className="max-h-64" showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                        <TouchableOpacity
                          onPress={() => handleAddressSelect()}
                          className="flex-row items-center border-b border-zinc-100 p-4 hover:bg-green-50 dark:border-zinc-700 dark:hover:bg-green-900/10"
                          activeOpacity={0.7}>
                          <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <Feather name="navigation" size={18} color="#22C55E" />
                          </View>
                          <View className="ml-4 flex-1">
                            <Text className="text-base font-medium text-green-600 dark:text-green-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                              Use Current Location
                            </Text>
                            <Text className="text-sm text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                              Detect your location automatically using GPS
                            </Text>
                          </View>
                          <Feather name="chevron-right" size={16} color="#22C55E" />
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
                    <View className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-600 dark:bg-green-900/20">
                      <View className="flex-row items-start">
                        <View className="mr-3 mt-0.5">
                          <Feather name="map-pin" size={16} color="#22C55E" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-green-700 dark:text-green-400" style={{ fontFamily: 'Poppins_500Medium' }}>
                            Selected Address:
                          </Text>
                          <Text className="mt-1 text-sm text-green-600 dark:text-green-300 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                            {[newAddress.street, newAddress.city, newAddress.state, newAddress.zipCode].filter(Boolean).join(', ')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Default Address Toggle */}
                  <TouchableOpacity
                    onPress={() => setNewAddress(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                    className="flex-row items-center rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50"
                    activeOpacity={0.7}>
                    <View className={`h-6 w-6 rounded-md border-2 items-center justify-center ${
                      newAddress.isDefault 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}>
                      {newAddress.isDefault && (
                        <Feather name="check" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        className="text-sm font-medium text-black dark:text-white"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        Set as default address
                      </Text>
                      <Text
                        className="text-xs text-zinc-500 dark:text-zinc-400"
                        style={{ fontFamily: 'Poppins_400Regular' }}>
                        This will be used for new orders automatically
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Form Actions */}
                <View className="mt-8 flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddForm(false);
                      setSelectedPlace(null);
                      setNewAddress({
                        label: '',
                        street: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        isDefault: false,
                        coordinates: { latitude: 0, longitude: 0 }
                      });
                      setShowAddressSearch(false);
                      setAddressSearchQuery('');
                      setAddressSearchResults([]);
                    }}
                    className="flex-1 rounded-xl border border-zinc-200 py-4 bg-white dark:border-zinc-600 dark:bg-zinc-800"
                    activeOpacity={0.7}>
                    <Text
                      className="text-center text-base font-medium text-zinc-600 dark:text-zinc-300"
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddAddress}
                    disabled={adding || !newAddress.label.trim() || !selectedPlace}
                    className={`flex-1 rounded-xl py-4 ${
                      adding || !newAddress.label.trim() || !selectedPlace
                        ? 'bg-zinc-300 dark:bg-zinc-600' 
                        : 'bg-black dark:bg-white shadow-lg'
                    }`}
                    activeOpacity={0.8}>
                    {adding ? (
                      <View className="flex-row items-center justify-center">
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text
                          className="ml-2 text-base font-medium text-white"
                          style={{ fontFamily: 'Poppins_500Medium' }}>
                          Adding...
                        </Text>
                      </View>
                    ) : (
                      <Text
                        className={`text-center text-base font-medium ${
                          !newAddress.label.trim() || !selectedPlace
                            ? 'text-zinc-500 dark:text-zinc-400'
                            : 'text-white dark:text-black'
                        }`}
                        style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Add Address
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
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
                  className="mt-3 text-center text-base text-zinc-500 dark:text-zinc-400 px-8"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  Add your delivery addresses to make ordering faster and easier
                </Text>
                {!showAddForm && (
                  <TouchableOpacity 
                    onPress={() => setShowAddForm(true)}
                    className="mt-8 rounded-xl bg-black px-8 py-4 dark:bg-white"
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
              <View>
                {Array.isArray(addresses) && addresses.map((address, index) => (
                  <View key={index} className={`rounded-2xl bg-white p-6 border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm ${index > 0 ? 'mt-4' : ''}`}>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-4">
                          <View className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${ 
                            address.isDefault 
                              ? 'bg-green-100 dark:bg-green-900/50' 
                              : 'bg-zinc-100 dark:bg-zinc-800'
                          }`}>
                            <Feather 
                              name={address.label.toLowerCase().includes('home') ? 'home' : 
                                    address.label.toLowerCase().includes('office') || address.label.toLowerCase().includes('work') ? 'briefcase' : 
                                    'map-pin'} 
                              size={18} 
                              color={
                                address.isDefault 
                                  ? '#22C55E' 
                                  : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')
                              } 
                            />
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <Text
                                className="text-lg font-semibold text-black dark:text-white"
                                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                                {address.label}
                              </Text>
                              {address.isDefault && (
                                <View className="ml-3 rounded-full bg-green-100 dark:bg-green-900 px-3 py-1">
                                  <Text
                                    className="text-xs font-medium text-green-700 dark:text-green-300"
                                    style={{ fontFamily: 'Poppins_500Medium' }}>
                                    Default
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                        <Text
                          className="text-sm text-zinc-600 dark:text-zinc-300 leading-6 pr-4"
                          style={{ fontFamily: 'Poppins_400Regular' }}>
                          {address && [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteAddress(index)}
                        disabled={deleting === index}
                        className="ml-4 rounded-full bg-red-50 p-3 dark:bg-red-900/30 shadow-sm"
                        activeOpacity={0.7}>
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
                    className="mt-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 py-8">
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