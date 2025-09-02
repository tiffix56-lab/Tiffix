import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types/auth.types';
import { Address } from '../types/address.types';

export interface DeliveryInfo {
  subscriptionId: string;
  menuId: string;
  deliveryAddress: Address;
  deliveryDate: string;
  lunchTime?: string;
  dinnerTime?: string;
  lunchEnabled: boolean;
  dinnerEnabled: boolean;
}

export interface SavedDeliveryInfo {
  _id: string;
  subscriptionId: string;
  menuId: string;
  deliveryAddress: Address;
  deliveryDate: string;
  lunchTime?: string;
  dinnerTime?: string;
  lunchEnabled: boolean;
  dinnerEnabled: boolean;
  createdAt: string;
}

class DeliveryService {
  async saveDeliveryInfo(deliveryInfo: DeliveryInfo): Promise<ApiResponse<{ deliveryInfo: SavedDeliveryInfo }>> {
    return await apiService.post<{ deliveryInfo: SavedDeliveryInfo }>(
      API_ENDPOINTS.DELIVERY.SAVE_INFO,
      deliveryInfo
    );
  }
}

export const deliveryService = new DeliveryService();