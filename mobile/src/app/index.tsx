import { View, Text, Image } from 'react-native';
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useAuth } from '@/context/AuthContext';
import { storageService } from '@/services/storage.service';

const SplashScreen = () => {
  const { colorScheme } = useColorScheme();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    const handleNavigation = async () => {
      if (!isInitialized) return;
      
      const timer = setTimeout(async () => {
        if (isAuthenticated) {
          router.replace('/(tabs)/home');
        } else {
          const onboardingCompleted = await storageService.getOnboardingCompleted();
          if (onboardingCompleted) {
            router.replace('/(auth)/welcome');
          } else {
            router.replace('/onboarding');
          }
        }
      }, 2500);

      return () => clearTimeout(timer);
    };

    handleNavigation();
  }, [isAuthenticated, isInitialized]);

  return (
    <View className="flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Image
        source={
          colorScheme === 'dark' ? require('@/assets/logo-dark.png') : require('@/assets/logo.png')
        }
        className="h-96 w-96"
        resizeMode="contain"
      />
      <Text className="absolute bottom-20 text-2xl font-normal text-black dark:text-white">
        Your Daily Tiffin, Delivered with Care
      </Text>
    </View>
  );
};

export default SplashScreen;
