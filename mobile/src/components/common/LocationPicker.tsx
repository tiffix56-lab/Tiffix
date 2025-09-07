import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { mapsService, AutocompleteResult, ParsedAddress } from '@/services/maps.service';

interface LocationPickerProps {
  onLocationSelect: (address: ParsedAddress) => void;
  onClose: () => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  title?: string;
}

const { width, height } = Dimensions.get('window');

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onClose,
  initialLocation,
  title = 'Select Location'
}) => {
  const { colorScheme } = useColorScheme();
  const mapRef = useRef<MapView>(null);
  
  // Use Delhi as default center (more central to India) or user's initial location
  const defaultLocation = initialLocation || {
    latitude: 28.6139, // Delhi
    longitude: 77.2090,
  };

  const [region, setRegion] = useState<Region>({
    latitude: defaultLocation.latitude,
    longitude: defaultLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  const [markerPosition, setMarkerPosition] = useState({
    latitude: defaultLocation.latitude,
    longitude: defaultLocation.longitude,
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AutocompleteResult[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<ParsedAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [sessionToken] = useState(() => mapsService.generateSessionToken());

  useEffect(() => {
    if (initialLocation) {
      getCurrentAddressFromCoords(initialLocation.latitude, initialLocation.longitude);
    } else {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await mapsService.getCurrentLocation();
      
      if (location) {
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setRegion(newRegion);
        setMarkerPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        mapRef.current?.animateToRegion(newRegion, 1000);
        
        await getCurrentAddressFromCoords(location.coords.latitude, location.coords.longitude);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Unable to get current location. Please search for your address.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      setAddressLoading(true);
      const address = await mapsService.reverseGeocode(latitude, longitude);
      if (address) {
        setSelectedAddress(address);
        setSearchQuery(address.fullAddress);
      }
    } catch (error) {
      console.error('Error getting address:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  const searchPlaces = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await mapsService.searchPlaces(query, sessionToken);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching places:', error);
    }
  };

  const selectPlace = async (result: AutocompleteResult) => {
    try {
      setLoading(true);
      setSearchResults([]);
      setSearchQuery(result.description);
      
      const placeDetails = await mapsService.getPlaceDetails(result.place_id, sessionToken);
      
      if (placeDetails) {
        const newRegion = {
          latitude: placeDetails.coordinates.latitude,
          longitude: placeDetails.coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setRegion(newRegion);
        setMarkerPosition({
          latitude: placeDetails.coordinates.latitude,
          longitude: placeDetails.coordinates.longitude,
        });
        setSelectedAddress(placeDetails);
        
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error selecting place:', error);
      Alert.alert('Error', 'Unable to select this location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    setMarkerPosition({ latitude, longitude });
    setRegion({
      ...region,
      latitude,
      longitude,
    });
    
    await getCurrentAddressFromCoords(latitude, longitude);
  };

  const confirmLocation = () => {
    if (selectedAddress) {
      onLocationSelect(selectedAddress);
      onClose();
    } else {
      Alert.alert('Error', 'Please select a valid location');
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 pt-12 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text
          className="text-lg font-semibold text-black dark:text-white"
          style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View className="px-6 py-4 bg-white dark:bg-black">
        <View className="relative">
          <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3">
            <Feather name="search" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              value={searchQuery}
              onChangeText={searchPlaces}
              placeholder="Search for location..."
              placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
              className="flex-1 ml-3 text-black dark:text-white"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <TouchableOpacity onPress={getCurrentLocation} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              ) : (
                <Feather name="crosshair" size={20} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              )}
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-64">
              <ScrollView className="py-2">
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={result.place_id}
                    onPress={() => selectPlace(result)}
                    className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <Text
                      className="text-black dark:text-white font-medium"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                      numberOfLines={1}>
                      {result.structured_formatting?.main_text || result.description}
                    </Text>
                    <Text
                      className="text-gray-500 dark:text-gray-400 text-sm mt-1"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      numberOfLines={1}>
                      {result.structured_formatting?.secondary_text || result.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Map */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          region={region}
          onPress={onMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          mapType="standard"
        >
          <Marker
            coordinate={markerPosition}
            title="Selected Location"
            description={selectedAddress?.fullAddress || 'Unknown location'}
          />
        </MapView>
      </View>

      {/* Selected Address Display */}
      <View className="px-6 py-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700">
        <View className="flex-row items-start">
          <Feather 
            name="map-pin" 
            size={20} 
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
            style={{ marginTop: 2 }}
          />
          <View className="flex-1 ml-3">
            {addressLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
                <Text className="ml-2 text-gray-500 dark:text-gray-400">Getting address...</Text>
              </View>
            ) : selectedAddress ? (
              <>
                <Text
                  className="text-black dark:text-white font-medium"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  {selectedAddress.street}
                </Text>
                <Text
                  className="text-gray-500 dark:text-gray-400 text-sm mt-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                </Text>
              </>
            ) : (
              <Text className="text-gray-500 dark:text-gray-400">No address selected</Text>
            )}
          </View>
        </View>
      </View>

      {/* Confirm Button */}
      <View className="px-6 pb-8 pt-4 bg-white dark:bg-black">
        <TouchableOpacity
          onPress={confirmLocation}
          disabled={!selectedAddress || loading}
          className={`py-4 rounded-xl ${
            selectedAddress && !loading
              ? 'bg-black dark:bg-white'
              : 'bg-gray-300 dark:bg-gray-700'
          }`}>
          <Text
            className={`text-center font-semibold ${
              selectedAddress && !loading
                ? 'text-white dark:text-black'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Confirm Location
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LocationPicker;