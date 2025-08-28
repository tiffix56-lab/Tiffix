import { View, Text, StyleSheet, Image } from 'react-native';
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

const SplashScreen = () => {
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

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
