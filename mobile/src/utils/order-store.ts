import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDER_DATA_KEY = '@order_data';

export interface OrderData {
  menuId: string;
  subscriptionId: string;
  selectedMenu: any;
  selectedSubscription: any;
  deliveryAddress: any;
  deliveryDate: string;
  lunchTime: string;
  dinnerTime: string;
  lunchEnabled: boolean;
  dinnerEnabled: boolean;
}

export const orderStore = {
  async saveOrderData(data: OrderData): Promise<void> {
    try {
      await AsyncStorage.setItem(ORDER_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving order data:', error);
      throw error;
    }
  },

  async getOrderData(): Promise<OrderData | null> {
    try {
      const data = await AsyncStorage.getItem(ORDER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting order data:', error);
      return null;
    }
  },

  async clearOrderData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ORDER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing order data:', error);
    }
  }
};