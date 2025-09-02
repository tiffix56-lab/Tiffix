import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { FormInput } from '@/components/common/FormInput';
import { LoadingButton } from '@/components/common/LoadingButton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { useAuth } from '@/context/AuthContext';
import { loginSchema } from '@/utils/validation';
import { LoginCredentials } from '@/types/auth.types';

const Login = () => {
  const { colorScheme } = useColorScheme();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string>('');
  const [, setSocialLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      emailAddress: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setError('');
    
    const result = await login(data);

    if (result.success) {
      router.replace('/(tabs)/home');
    } else {
      setError(result.message);
    }
  };

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

          <ErrorMessage message={error} visible={!!error} className="mb-6" />

          <View className="gap-6">
            <FormInput
              name="emailAddress"
              control={control}
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.emailAddress}
            />

            <FormInput
              name="password"
              control={control}
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
            />

            {/* Forgot Password */}
            <View className="flex-row justify-end pt-2">
              <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                <Text className="text-sm font-medium text-black dark:text-white">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <LoadingButton
              title="Login"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              className="mt-8 w-full"
            />

            {/* Sign Up Link */}
            <View className="flex-row justify-center pt-6">
              <Text className="mr-4 text-sm text-zinc-500 dark:text-zinc-400">
                Don&apos;t have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text className="text-sm font-semibold text-black dark:text-white">SIGN UP</Text>
              </TouchableOpacity>
            </View>
          </View>

          <SocialLoginButtons onLoading={setSocialLoading} className="pb-8 pt-10" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Login;
