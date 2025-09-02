import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { Address, AddAddressRequest, UserProfile } from '../types/address.types';
import { ApiResponse } from '../types/auth.types';

class AddressService {
  // Transform frontend coordinates to backend GeoJSON format
  private transformCoordinatesToGeoJSON(coordinates: { latitude: number; longitude: number }) {
    return {
      type: 'Point',
      coordinates: [coordinates.longitude, coordinates.latitude]
    };
  }

  // Transform backend GeoJSON coordinates to frontend format
  private transformCoordinatesFromGeoJSON(geoJsonCoords: any) {
    // Handle both GeoJSON format and already transformed coordinates
    if (geoJsonCoords) {
      if (geoJsonCoords.coordinates && Array.isArray(geoJsonCoords.coordinates) && geoJsonCoords.coordinates.length === 2) {
        return {
          latitude: geoJsonCoords.coordinates[1],
          longitude: geoJsonCoords.coordinates[0]
        };
      } else if (geoJsonCoords.latitude !== undefined && geoJsonCoords.longitude !== undefined) {
        return {
          latitude: geoJsonCoords.latitude,
          longitude: geoJsonCoords.longitude
        };
      }
    }
    return { latitude: 0, longitude: 0 };
  }

  async getAllAddresses(): Promise<ApiResponse<{ addresses: Address[]; totalAddresses: number }>> {
    try {
      const response = await apiService.get<{ addresses: Address[]; totalAddresses: number }>(API_ENDPOINTS.USER.ADDRESSES);
      
      // If profile not found, return empty addresses instead of error
      if (!response.success && response.message?.includes('not found')) {
        return {
          success: true,
          message: 'No addresses found',
          data: { addresses: [], totalAddresses: 0 }
        };
      }

      // Transform coordinates from GeoJSON to frontend format
      if (response.success && response.data && response.data.addresses) {
        const transformedAddresses = response.data.addresses.map(address => ({
          ...address,
          coordinates: this.transformCoordinatesFromGeoJSON(address.coordinates)
        }));
        
        return {
          ...response,
          data: {
            ...response.data,
            addresses: transformedAddresses
          }
        };
      }
      
      return response;
    } catch (error) {
      return {
        success: true,
        message: 'No addresses found', 
        data: { addresses: [], totalAddresses: 0 }
      };
    }
  }

  async addAddress(addressData: AddAddressRequest): Promise<ApiResponse<{ userProfile: UserProfile; message: string }>> {
    // Transform coordinates to backend format
    const backendAddressData = {
      ...addressData,
      coordinates: addressData.coordinates ? this.transformCoordinatesToGeoJSON(addressData.coordinates) : undefined
    };

    return await apiService.post<{ userProfile: UserProfile; message: string }>(
      API_ENDPOINTS.USER.ADDRESSES,
      backendAddressData
    );
  }

  async updateAddress(
    addressIndex: number,
    addressData: AddAddressRequest
  ): Promise<ApiResponse<{ userProfile: UserProfile; message: string }>> {
    // Transform coordinates to backend format
    const backendAddressData = {
      ...addressData,
      coordinates: addressData.coordinates ? this.transformCoordinatesToGeoJSON(addressData.coordinates) : undefined
    };

    return await apiService.put<{ userProfile: UserProfile; message: string }>(
      `${API_ENDPOINTS.USER.ADDRESSES}/${addressIndex}`,
      backendAddressData
    );
  }

  async deleteAddress(addressIndex: number): Promise<ApiResponse<{ userProfile: UserProfile; message: string }>> {
    return await apiService.delete<{ userProfile: UserProfile; message: string }>(
      `${API_ENDPOINTS.USER.ADDRESSES}/${addressIndex}`
    );
  }

  async getUserProfile(): Promise<ApiResponse<{ userProfile: UserProfile }>> {
    return await apiService.get<{ userProfile: UserProfile }>(API_ENDPOINTS.USER.PROFILE);
  }
}

export const addressService = new AddressService();