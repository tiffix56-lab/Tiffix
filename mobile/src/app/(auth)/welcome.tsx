import { View, Text, Image } from 'react-native';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { LoadingButton } from '@/components/common/LoadingButton';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';

const Welcome = () => {
  const { colorScheme } = useColorScheme();
  const [, setSocialLoading] = useState(false);

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

          <LoadingButton
            title="Login"
            onPress={() => router.push('/login')}
            className="mb-8 w-full"
            loading={false}
          />

          <SocialLoginButtons onLoading={setSocialLoading} />
        </View>
      </View>
    </View>
  );
};

export default Welcome;
