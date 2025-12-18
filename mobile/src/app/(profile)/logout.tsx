import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/auth.service';
import { STORAGE_KEYS } from '@/constants/storage';

const Logout = () => {
  const { colorScheme } = useColorScheme();
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    handleLogout();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call logout API
      const response = await authService.logout();
      
      if (response.success) {
        // Clear all stored data
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
          AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN),
          AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
        ]);
        
        console.log('Logout successful, clearing storage and redirecting');
        
        // Navigate to auth screen
        router.replace('/');
      } else {
        // Even if API call fails, clear local storage and redirect
        console.log('Logout API failed, but clearing local data anyway');
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
          AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN),
          AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
        ]);
        
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even on error, clear local storage and redirect
      try {
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
          AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN),
          AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
        ]);
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
      
      Alert.alert(
        'Logout',
        'You have been logged out successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login')
          }
        ]
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-zinc-50 dark:bg-neutral-900">
      <ActivityIndicator 
        size="large" 
        color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
      />
      <Text
        className="mt-4 text-lg font-medium text-black dark:text-white"
        style={{ fontFamily: 'Poppins_500Medium' }}>
        Logging out...
      </Text>
    </View>
  );
};

export default Logout;