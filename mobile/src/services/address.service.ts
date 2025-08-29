import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { Address, AddAddressRequest, UserProfile } from '../types/address.types';
import { ApiResponse } from '../types/auth.types';

class AddressService {
  async getAllAddresses(): Promise<ApiResponse<{ addresses: Address[]; totalAddresses: number }>> {
    return await apiService.get<{ addresses: Address[]; totalAddresses: number }>(API_ENDPOINTS.USER.ADDRESSES);
  }

  async addAddress(addressData: AddAddressRequest): Promise<ApiResponse<{ userProfile: UserProfile; message: string }>> {
    return await apiService.post<{ userProfile: UserProfile; message: string }>(
      API_ENDPOINTS.USER.ADDRESSES,
      addressData
    );
  }

  async updateAddress(
    addressIndex: number,
    addressData: AddAddressRequest
  ): Promise<ApiResponse<{ userProfile: UserProfile; message: string }>> {
    return await apiService.put<{ userProfile: UserProfile; message: string }>(
      `${API_ENDPOINTS.USER.ADDRESSES}/${addressIndex}`,
      addressData
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