import { View, Text } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '@/context/AuthContext';
import { storageService } from '@/services/storage.service';

const SplashScreen = () => {
  const { colorScheme } = useColorScheme();
  const { isAuthenticated, isInitialized } = useAuth();
  const videoRef = useRef<Video>(null);

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

  // Play video when component mounts
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-black dark:bg-black">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Video
        ref={videoRef}
        source={require('@/assets/tiffix_sc.mp4')}
        style={{ width: 384, height: 384 }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping
        isMuted
      />
      {/* <Text className="absolute bottom-20 text-2xl font-normal text-black dark:text-white">
        Your Daily Tiffin, Delivered with Care
      </Text> */}
    </View>
  );
};

export default SplashScreen;
