import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
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
import { resetPasswordSchema } from '@/utils/validation';
import { ResetPasswordData } from '@/types/auth.types';
import { maskEmail } from '@/utils/format.utils';

const ResetPassword = () => {
  const { colorScheme } = useColorScheme();
  const { resetPassword } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const emailAddress = params?.email || '';
  
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      emailAddress,
      otp: '',
      newPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordData) => {
    setError('');
    setIsLoading(true);
    
    const result = await resetPassword(data);
    
    if (result.success) {
      router.replace('/login');
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <View className="h-12" />

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
              Reset Password
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          <View className="mb-10 items-center">
            <Text className="mb-4 text-3xl font-semibold text-black dark:text-white">
              Reset Password
            </Text>
            <Text className="text-center text-base leading-6 text-zinc-500 dark:text-zinc-400">
              Enter the reset code sent to {maskEmail(emailAddress)} and your new password
            </Text>
          </View>

          <ErrorMessage message={error} visible={!!error} className="mb-6" />

          <View className="gap-6">
            <FormInput
              name="otp"
              control={control}
              label="Reset Code"
              placeholder="Enter 6-digit reset code"
              keyboardType="numeric"
              maxLength={6}
              error={errors.otp}
            />

            <FormInput
              name="newPassword"
              control={control}
              label="New Password"
              placeholder="Enter your new password"
              secureTextEntry
              error={errors.newPassword}
            />

            <LoadingButton
              title="Reset Password"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              className="mt-8 w-full"
            />

            <View className="flex-row justify-center pt-6">
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Remember your password?
              </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className="ml-2 text-sm font-semibold text-black dark:text-white">
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default ResetPassword;