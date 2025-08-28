import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import ThemeToggle from '@/components/ui/ThemeToggle';

const ForgotPassword = () => {
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* More top margin */}
      <View className="h-12" />

      {/* Header with more height and rounded back button */}
      <View className="bg-zinc-50 px-6 pb-8 pt-8 dark:bg-neutral-900">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
            <Feather
              name="arrow-left"
              size={20}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-3xl font-semibold text-black dark:text-white">
              Forgot Password
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Content Section */}
          <View className="mb-10 items-center">
            <Text className="mb-4 text-3xl font-semibold text-black dark:text-white">
              Forgot Password
            </Text>
            <Text className="text-center text-base leading-6 text-zinc-500 dark:text-zinc-400">
              Please enter your phone number below{'\n'}to receive your OTP number.
            </Text>
          </View>

          {/* Form */}
          <View className="gap-6">
            {/* Email Field */}
            <View>
              <Text className="mb-3 text-base font-medium text-black dark:text-white">Email</Text>
              <View className="rounded-md border border-zinc-100 bg-zinc-50 dark:border-zinc-400 dark:bg-black">
                <TextInput
                  className="min-h-14 px-4 py-4 text-base text-black dark:text-white"
                  placeholder="email"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              className="mt-8 rounded-3xl bg-black py-4 dark:bg-white"
              onPress={() => router.push('/otp')}>
              <Text className="text-center text-lg font-medium text-white dark:text-black">
                Send OTP
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default ForgotPassword;
