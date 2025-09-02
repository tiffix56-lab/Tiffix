import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { MenuItem, MenuResponse, MenuQuery } from '../types/menu.types';
import { ApiResponse } from '../types/auth.types';

class MenuService {
  async getMenus(query?: MenuQuery): Promise<ApiResponse<MenuResponse>> {
    const queryParams = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.MENU.GET_ALL}?${queryParams.toString()}`
      : API_ENDPOINTS.MENU.GET_ALL;
    
    return await apiService.get<MenuResponse>(url);
  }

  async getMenuById(id: string): Promise<ApiResponse<{ menu: MenuItem }>> {
    return await apiService.get<{ menu: MenuItem }>(`${API_ENDPOINTS.MENU.GET_BY_ID}/${id}`);
  }

  async getVendorMenus(query?: Omit<MenuQuery, 'vendorCategory'>): Promise<ApiResponse<MenuResponse>> {
    return await this.getMenus({
      ...query,
      vendorCategory: 'food_vendor',
    });
  }

  async getHomeChefMenus(query?: Omit<MenuQuery, 'vendorCategory'>): Promise<ApiResponse<MenuResponse>> {
    return await this.getMenus({
      ...query,
      vendorCategory: 'home_chef',
    });
  }
}

export const menuService = new MenuService();