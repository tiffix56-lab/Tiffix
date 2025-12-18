import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { User } from '../types/auth.types';

class StorageService {
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async setUserData(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  async getUserData(): Promise<User | null> {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  async setRememberMe(remember: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, JSON.stringify(remember));
  }

  async getRememberMe(): Promise<boolean> {
    const remember = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    return remember ? JSON.parse(remember) : false;
  }


  async setOnboardingCompleted(completed: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed));
  }

  async getOnboardingCompleted(): Promise<boolean> {
    const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return completed ? JSON.parse(completed) : false;
  }

  async setNeedsProfileCompletion(needs: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.NEEDS_PROFILE_COMPLETION, JSON.stringify(needs));
  }

  async getNeedsProfileCompletion(): Promise<boolean> {
    const needs = await AsyncStorage.getItem(STORAGE_KEYS.NEEDS_PROFILE_COMPLETION);
    return needs ? JSON.parse(needs) : false;
  }

  async removeNeedsProfileCompletion(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.NEEDS_PROFILE_COMPLETION);
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.REMEMBER_ME,
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      STORAGE_KEYS.NEEDS_PROFILE_COMPLETION,
      '@order_data',
    ]);
  }

  async clearAuthData(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.NEEDS_PROFILE_COMPLETION,
    ]);
  }

  // Generic storage methods
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

export const storageService = new StorageService();