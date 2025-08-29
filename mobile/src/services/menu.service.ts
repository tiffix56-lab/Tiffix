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
    // Since backend doesn't have individual menu endpoint, get all and filter
    const allMenus = await this.getMenus();
    if (allMenus.success && allMenus.data?.menus) {
      const menu = allMenus.data.menus.find(m => m._id === id);
      if (menu) {
        return {
          success: true,
          message: 'Menu found',
          data: { menu }
        } as ApiResponse<{ menu: MenuItem }>;
      }
    }
    return {
      success: false,
      message: 'Menu not found',
      data: null
    } as ApiResponse<{ menu: MenuItem }>;
  }

  async getVendorMenus(query?: Omit<MenuQuery, 'vendorCategory'>): Promise<ApiResponse<MenuResponse>> {
    return await this.getMenus({
      ...query,
      vendorCategory: 'vendor',
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