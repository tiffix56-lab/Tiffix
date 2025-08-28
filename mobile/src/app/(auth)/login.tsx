import { View, Text, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import ThemeToggle from '@/components/ui/ThemeToggle';

const Login = () => {
  const { colorScheme } = useColorScheme();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
            <Text className="text-3xl font-semibold text-black dark:text-white">Log In</Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Welcome Section */}
          <View className="mb-10 items-center">
            <Text className="mb-4 text-3xl font-semibold text-black dark:text-white">
              Welcome Back
            </Text>
            <Text className="text-center text-base leading-6 text-zinc-500 dark:text-zinc-400">
              Sign in with your email and password{'\n'}or continue with social media
            </Text>
          </View>

          {/* Form */}
          <View className="gap-6">
            {/* Email Field */}
            <View>
              <Text className="mb-3 text-base font-medium text-black dark:text-white">Email</Text>
              <View className="rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black ">
                <TextInput
                  className="min-h-14 px-4 py-4 text-base text-black dark:rounded-md dark:border-zinc-400  dark:text-white "
                  placeholder="email"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View>
              <Text className="mb-3 text-base font-medium text-black dark:text-white">
                Password
              </Text>
              <View className="min-h-14 flex-row items-center rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black">
                <TextInput
                  className="flex-1 text-base text-black dark:text-white"
                  placeholder="password"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password */}
            <View className="flex-row items-center justify-between pt-2">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setRememberMe(!rememberMe)}>
                <View
                  className={`mr-3 h-5 w-5 items-center justify-center rounded border-2 ${
                    rememberMe
                      ? 'border-black bg-black dark:border-white dark:bg-white'
                      : 'border-zinc-200 bg-transparent dark:border-zinc-700'
                  }`}>
                  {rememberMe && (
                    <Feather
                      name="check"
                      size={12}
                      color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'}
                    />
                  )}
                </View>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                <Text className="text-sm font-medium text-black dark:text-white">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}

            <TouchableOpacity
              onPress={() => router.push('/home')}
              className="mt-8 rounded-3xl bg-black py-4 dark:bg-white">
              <Text className="text-center text-lg font-medium text-white dark:text-black">
                Login
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="flex-row justify-center pt-6">
              <Text className="mr-4 text-sm text-zinc-500 dark:text-zinc-400">
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text className="text-sm font-semibold text-black dark:text-white">SIGN UP</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Login */}
          <View className="items-center pb-8 pt-10">
            <Text className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Or Login With...</Text>
            <View className="flex-row justify-center gap-6">
              <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full">
                <Image
                  source={require('@/assets/facebook.png')}
                  style={{ height: 40, width: 40 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full">
                <Image
                  source={require('@/assets/google.png')}
                  style={{ height: 40, width: 40 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full">
                <Image
                  source={require('@/assets/apple.png')}
                  style={{ height: 40, width: 40 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default Login;
