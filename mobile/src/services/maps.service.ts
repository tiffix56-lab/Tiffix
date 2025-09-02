import * as Location from 'expo-location';

export interface GooglePlaceResult {
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

export interface AutocompleteResult {
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

class MapsService {
  private readonly GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  private readonly PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
  private readonly GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode';

  constructor() {
    if (!this.GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your environment');
    }
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
   * Reverse geocode coordinates to get formatted address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ParsedAddress | null> {
    try {
      if (!this.GOOGLE_MAPS_API_KEY) {
        // Fallback to Expo's reverse geocoding
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
        return null;
      }

      const response = await fetch(
        `${this.GEOCODING_BASE_URL}/json?latlng=${latitude},${longitude}&key=${this.GOOGLE_MAPS_API_KEY}&language=en`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return this.parseGooglePlaceResult(data.results[0]);
      }

      throw new Error(`Geocoding failed: ${data.status}`);
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Search places using Google Places Autocomplete
   */
  async searchPlaces(query: string, sessionToken?: string): Promise<AutocompleteResult[]> {
    try {
      if (!this.GOOGLE_MAPS_API_KEY) {
        console.warn('Google Places API not available');
        return [];
      }

      if (query.length < 2) return [];

      const params = new URLSearchParams({
        input: query,
        key: this.GOOGLE_MAPS_API_KEY,
        language: 'en',
        components: 'country:in', // Restrict to India
        ...(sessionToken && { sessiontoken: sessionToken }),
      });

      const response = await fetch(
        `${this.PLACES_BASE_URL}/autocomplete/json?${params.toString()}`
      );

      const data = await response.json();

      if (data.status === 'OK') {
        return data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          structured_formatting: prediction.structured_formatting,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  /**
   * Get place details by place_id
   */
  async getPlaceDetails(placeId: string, sessionToken?: string): Promise<ParsedAddress | null> {
    try {
      if (!this.GOOGLE_MAPS_API_KEY) {
        console.warn('Google Places API not available');
        return null;
      }

      const params = new URLSearchParams({
        place_id: placeId,
        key: this.GOOGLE_MAPS_API_KEY,
        fields: 'formatted_address,geometry,address_components,name',
        language: 'en',
        ...(sessionToken && { sessiontoken: sessionToken }),
      });

      const response = await fetch(
        `${this.PLACES_BASE_URL}/details/json?${params.toString()}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return this.parseGooglePlaceResult(data.result);
      }

      throw new Error(`Place details failed: ${data.status}`);
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  /**
   * Parse Google Places API result to our address format
   */
  private parseGooglePlaceResult(result: GooglePlaceResult): ParsedAddress {
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
   * Generate session token for Places API requests
   */
  generateSessionToken(): string {
    return 'session_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Convert coordinates from Google Maps format to backend format
   */
  convertToBackendFormat(coords: { latitude: number; longitude: number }) {
    return {
      type: 'Point' as const,
      coordinates: [coords.longitude, coords.latitude], // [longitude, latitude] for GeoJSON
    };
  }

  /**
   * Convert coordinates from backend format to Google Maps format
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
}

export const mapsService = new MapsService();