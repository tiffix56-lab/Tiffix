import * as Location from 'expo-location';
import { apiService } from './api.service';
import { API_ENDPOINTS } from '@/constants/api';

export interface OlaPlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  name?: string;
}

export interface OlaAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  fullAddress: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

class OlaMapsService {
  constructor() {
    console.log('✅ Ola Maps service initialized (using backend proxy)');
  }

  /**
   * Get current location using device GPS
   */
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      });

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get formatted address using Ola Maps (via backend proxy)
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ParsedAddress | null> {
    try {
      console.log('Reverse geocoding via backend proxy:', { latitude, longitude });

      const requestBody = {
        latitude,
        longitude,
      };

      const response = await apiService.post(
        API_ENDPOINTS.MAPS.REVERSE_GEOCODE,
        requestBody
      );

      console.log('Backend proxy reverse geocoding response:', {
        success: response.success,
        status: response.data?.status,
        resultsCount: response.data?.results?.length || 0
      });

      if (response.success && response.data?.status?.toLowerCase() === 'ok' && response.data?.results?.length > 0) {
        return this.parseOlaPlaceResult(response.data.results[0]);
      }

      throw new Error(`Backend reverse geocoding failed: ${response.data?.status || 'Unknown error'}`);
    } catch (error) {
      console.error('Error in backend reverse geocoding:', error);
      // Fallback to Expo location service
      try {
        console.log('Falling back to Expo location service');
        const addresses = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (addresses.length > 0) {
          const addr = addresses[0];
          return {
            street: `${addr.streetNumber || ''} ${addr.street || ''}`.trim(),
            city: addr.city || '',
            state: addr.region || '',
            zipCode: addr.postalCode || '',
            country: addr.country || '',
            fullAddress: [
              addr.streetNumber,
              addr.street,
              addr.city,
              addr.region,
              addr.postalCode,
              addr.country
            ].filter(Boolean).join(', '),
            coordinates: { latitude, longitude }
          };
        }
      } catch (fallbackError) {
        console.error('Fallback geocoding also failed:', fallbackError);
      }
      return null;
    }
  }

  /**
   * Search places using Ola Maps Autocomplete (via backend proxy)
   */
  async searchPlaces(query: string, sessionToken?: string): Promise<OlaAutocompleteResult[]> {
    try {
      if (!query || query.length < 2) return [];

      console.log('Searching places via backend proxy:', query);

      const requestBody = {
        query,
        ...(sessionToken && { sessionToken }),
        location: '28.6139,77.2090', // Delhi as reference point for India
        radius: '50000', // 50km radius
      };

      const response = await apiService.post(
        API_ENDPOINTS.MAPS.AUTOCOMPLETE,
        requestBody
      );

      console.log('Backend proxy autocomplete response:', {
        success: response.success,
        status: response.data?.status,
        predictionsCount: response.data?.predictions?.length || 0
      });

      if (response.success && response.data?.status?.toLowerCase() === 'ok' && response.data?.predictions) {
        return response.data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          structured_formatting: prediction.structured_formatting,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching places via backend proxy:', error);
      return [];
    }
  }

  /**
   * Get place details by place_id using Ola Maps (via backend proxy)
   */
  async getPlaceDetails(placeId: string, sessionToken?: string): Promise<ParsedAddress | null> {
    try {
      console.log('Getting place details via backend proxy:', placeId);

      const requestBody = {
        placeId,
        ...(sessionToken && { sessionToken }),
      };

      const response = await apiService.post(
        API_ENDPOINTS.MAPS.PLACE_DETAILS,
        requestBody
      );

      console.log('Backend proxy place details response:', {
        success: response.success,
        status: response.data?.status,
        hasResult: !!response.data?.result
      });

      if (response.success && response.data?.status?.toLowerCase() === 'ok' && response.data?.result) {
        return this.parseOlaPlaceResult(response.data.result);
      }

      throw new Error(`Backend place details failed: ${response.data?.status || 'Unknown error'}`);
    } catch (error) {
      console.error('Error getting place details via backend proxy:', error);
      return null;
    }
  }

  /**
   * Parse Ola Maps API result to our address format
   */
  private parseOlaPlaceResult(result: OlaPlaceResult): ParsedAddress {
    const components = result.address_components || [];
    
    const getComponent = (types: string[]) => {
      const component = components.find(comp => 
        types.some(type => comp.types.includes(type))
      );
      return component?.long_name || '';
    };

    const getShortComponent = (types: string[]) => {
      const component = components.find(comp => 
        types.some(type => comp.types.includes(type))
      );
      return component?.short_name || '';
    };

    const streetNumber = getComponent(['street_number']);
    const route = getComponent(['route']);
    const sublocality = getComponent(['sublocality', 'sublocality_level_1']);
    const locality = getComponent(['locality']);
    const city = getComponent(['administrative_area_level_2']) || locality;
    const state = getShortComponent(['administrative_area_level_1']);
    const zipCode = getComponent(['postal_code']);
    const country = getShortComponent(['country']);

    // Build street address
    const streetParts = [streetNumber, route, sublocality].filter(Boolean);
    const street = streetParts.join(', ') || getComponent(['establishment', 'point_of_interest']);

    return {
      street: street || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
      country: country || 'IN',
      fullAddress: result.formatted_address || '',
      coordinates: {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      },
    };
  }

  /**
   * Generate session token for API requests (via backend)
   */
  async generateSessionToken(): Promise<string> {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.MAPS.SESSION_TOKEN
      );

      if (response.success && response.data?.sessionToken) {
        return response.data.sessionToken;
      }

      // Fallback to local generation
      return 'tiffix_session_' + Math.random().toString(36).substring(2, 15);
    } catch (error) {
      console.error('Error generating session token via backend:', error);
      // Fallback to local generation
      return 'tiffix_session_' + Math.random().toString(36).substring(2, 15);
    }
  }

  /**
   * Convert coordinates to backend format
   */
  convertToBackendFormat(coords: { latitude: number; longitude: number }) {
    return {
      type: 'Point' as const,
      coordinates: [coords.longitude, coords.latitude], // [longitude, latitude] for GeoJSON
    };
  }

  /**
   * Convert coordinates from backend format
   */
  convertFromBackendFormat(coords: { type: string; coordinates: [number, number] }) {
    return {
      latitude: coords.coordinates[1],
      longitude: coords.coordinates[0],
    };
  }

  /**
   * Get distance between two coordinates in kilometers
   */
  getDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check if location services are available
   */
  async isLocationAvailable(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Error checking location availability:', error);
      return false;
    }
  }

  /**
   * Get location permission status
   */
  async getLocationPermission(): Promise<Location.LocationPermissionResponse> {
    try {
      return await Location.getForegroundPermissionsAsync();
    } catch (error) {
      console.error('Error getting location permission:', error);
      throw error;
    }
  }

  /**
   * Test API connection via backend proxy
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing backend proxy connection to Ola Maps...');
      
      // Test with a simple reverse geocoding request for Delhi
      const testResult = await this.reverseGeocode(28.6139, 77.2090);
      
      if (testResult) {
        console.log('✅ Backend proxy connection test successful');
        return true;
      } else {
        console.error('❌ Backend proxy connection test failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Backend proxy connection test error:', error);
      return false;
    }
  }
}

export const olaMapsService = new OlaMapsService();