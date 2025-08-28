import { View, Text, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import ThemeToggle from '@/components/ui/ThemeToggle';

const Welcome = () => {
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-black">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Theme toggle */}
      <View style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }}>
        <ThemeToggle />
      </View>

      {/* More top margin */}
      <View className="h-12" />

      {/* Logo Section */}
      <View className="flex-1 items-center justify-center">
        <Image
          source={
            colorScheme === 'dark'
              ? require('@/assets/logo-dark.png')
              : require('@/assets/logo.png')
          }
          className="h-96 w-96"
          resizeMode="contain"
        />
      </View>

      {/* Content Section */}
      <View className="flex-1 justify-center px-8">
        <View className="items-center">
          <Text
            className="mb-6 text-3xl font-semibold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Welcome to TIFFIX
          </Text>
          <Text
            className="mb-12 text-center text-base leading-6 text-zinc-500 dark:text-zinc-400"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            Amet minim mollit non deserunt{'\n'}ullamco est sit aliqua dolor do amet.
          </Text>

          {/* Login Button */}
          <TouchableOpacity
            className="mb-8 w-full rounded-3xl bg-black py-4 dark:bg-white"
            onPress={() => router.push('/login')}>
            <Text
              className="text-center text-lg font-medium text-white dark:text-black"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Login
            </Text>
          </TouchableOpacity>

          {/* Social Login Section */}
          <Text
            className="mb-6 text-base text-zinc-500 dark:text-zinc-400"
            style={{ fontFamily: 'Poppins_500Medium' }}>
            Or Login With...
          </Text>
          <View className="flex-row justify-center space-x-6">
            <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full">
              <Image
                source={require('@/assets/facebook.png')}
                className="h-10 w-10"
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full">
              <Image
                source={require('@/assets/google.png')}
                className="h-10 w-10"
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full">
              <Image
                source={require('@/assets/apple.png')}
                className="h-10 w-10"
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Welcome;
