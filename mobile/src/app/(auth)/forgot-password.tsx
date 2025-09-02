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
import { useAuth } from '@/context/AuthContext';
import { forgotPasswordSchema } from '@/utils/validation';
import { ForgotPasswordData } from '@/types/auth.types';

const ForgotPassword = () => {
  const { colorScheme } = useColorScheme();
  const { forgotPassword } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      emailAddress: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setError('');
    setIsLoading(true);
    
    const result = await forgotPassword(data);
    
    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  const handleResetPassword = () => {
    router.push({
      pathname: '/reset-password',
      params: { email: getValues('emailAddress') },
    });
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
          <View className="mb-10 items-center">
            <Text className="mb-4 text-3xl font-semibold text-black dark:text-white">
              Forgot Password
            </Text>
            <Text className="text-center text-base leading-6 text-zinc-500 dark:text-zinc-400">
              {isSuccess 
                ? 'Password reset code has been sent to your email address. Please check your inbox.'
                : 'Please enter your email address below to receive your password reset code.'
              }
            </Text>
          </View>

          <ErrorMessage message={error} visible={!!error} className="mb-6" />

          {isSuccess ? (
            <View className="gap-6">
              <View className="rounded-lg bg-green-50 border border-green-200 p-4 dark:bg-green-900/20 dark:border-green-800">
                <View className="flex-row items-center">
                  <Feather name="check-circle" size={20} color="#22C55E" style={{ marginRight: 8 }} />
                  <Text className="text-green-700 dark:text-green-400 font-medium">
                    Reset code sent successfully!
                  </Text>
                </View>
              </View>
              
              <LoadingButton
                title="Enter Reset Code"
                onPress={handleResetPassword}
                className="w-full"
              />
              
              <TouchableOpacity onPress={() => setIsSuccess(false)}>
                <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Use different email address
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-6">
              <FormInput
                name="emailAddress"
                control={control}
                label="Email"
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.emailAddress}
              />

              <LoadingButton
                title="Send Reset Code"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                className="mt-8 w-full"
              />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default ForgotPassword;
