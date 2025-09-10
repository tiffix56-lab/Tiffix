import * as Location from 'expo-location';
import { olaMapsService, ParsedAddress, OlaAutocompleteResult } from './ola-maps.service';

// Re-export types for backward compatibility
export interface AutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export { ParsedAddress };

class MapsService {
  private readonly OLA_MAPS_API_KEY = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY || '';

  constructor() {
    if (!this.OLA_MAPS_API_KEY) {
      console.warn('Ola Maps API key not found. Please set EXPO_PUBLIC_OLA_MAPS_API_KEY in your environment');
      console.log('Using Expo Location services as fallback');
    } else {
      console.log('Using Ola Maps API for location services');
    }
  }

  /**
   * Get current location using device GPS
   */
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    // Delegate to Ola Maps service which handles this properly
    return await olaMapsService.getCurrentLocation();
  }

  /**
   * Reverse geocode coordinates to get formatted address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ParsedAddress | null> {
    // Use Ola Maps service which handles fallbacks internally
    return await olaMapsService.reverseGeocode(latitude, longitude);
  }

  /**
   * Search places using Ola Maps Autocomplete
   */
  async searchPlaces(query: string, sessionToken?: string): Promise<AutocompleteResult[]> {
    if (query.length < 2) return [];

    const results = await olaMapsService.searchPlaces(query, sessionToken);
    return results.map((result: OlaAutocompleteResult) => ({
      place_id: result.place_id,
      description: result.description,
      structured_formatting: result.structured_formatting,
    }));
  }

  /**
   * Get place details by place_id
   */
  async getPlaceDetails(placeId: string, sessionToken?: string): Promise<ParsedAddress | null> {
    return await olaMapsService.getPlaceDetails(placeId, sessionToken);
  }


  /**
   * Generate session token for API requests
   */
  async generateSessionToken(): Promise<string> {
    return await olaMapsService.generateSessionToken();
  }

  /**
   * Convert coordinates to backend format
   */
  convertToBackendFormat(coords: { latitude: number; longitude: number }) {
    return olaMapsService.convertToBackendFormat(coords);
  }

  /**
   * Convert coordinates from backend format
   */
  convertFromBackendFormat(coords: { type: string; coordinates: [number, number] }) {
    return olaMapsService.convertFromBackendFormat(coords);
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
    return olaMapsService.getDistance(lat1, lon1, lat2, lon2);
  }


  /**
   * Check if location services are available
   */
  async isLocationAvailable(): Promise<boolean> {
    return await olaMapsService.isLocationAvailable();
  }

  /**
   * Get location permission status
   */
  async getLocationPermission(): Promise<Location.LocationPermissionResponse> {
    return await olaMapsService.getLocationPermission();
  }
}

export const mapsService = new MapsService();