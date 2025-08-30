import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
import { registerSchema } from '@/utils/validation';
import { formatPhoneNumber } from '@/utils/format.utils';
import { RegisterCredentials } from '@/types/auth.types';

const Signup = () => {
  const { colorScheme } = useColorScheme();
  const { register, isLoading } = useAuth();
  const [error, setError] = useState<string>('');
  const [, setSocialLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterCredentials>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      emailAddress: '',
      password: '',
      phoneNumber: '',
      referralCode: '',
    },
  });

  const onSubmit = async (data: RegisterCredentials) => {
    setError('');
    
    const formattedData = {
      ...data,
      phoneNumber: formatPhoneNumber(data.phoneNumber),
    };

    // Remove empty referralCode to avoid backend validation issues
    if (!formattedData.referralCode || formattedData.referralCode.trim() === '') {
      delete formattedData.referralCode;
    }

    console.log('Signup form - submitting data:', JSON.stringify(formattedData, null, 2));
    const result = await register(formattedData);
    
    if (result.success) {
      if (result.requiresVerification) {
        router.push({
          pathname: '/otp',
          params: { email: data.emailAddress },
        });
      } else {
        router.replace('/(tabs)/home');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
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
              <Text className="text-3xl font-semibold text-black dark:text-white">Sign Up</Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* Main content with rounded top corners */}
        <View className="flex-1 rounded-t-3xl bg-white pb-10 dark:bg-black">
          <ScrollView
            className="flex-1 px-6 pt-10"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Welcome Section */}
            <View className="mb-10 items-center">
              <Text className="mb-4 text-3xl font-semibold text-black dark:text-white">
                Create an account
              </Text>
              <Text className="text-center text-base leading-6 text-zinc-500 dark:text-zinc-400">
                Complete your details or continue{'\n'}with social media
              </Text>
            </View>

            <ErrorMessage message={error} visible={!!error} className="mb-6" />

            <View className="gap-6">
              <FormInput
                name="password"
                control={control}
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                error={errors.password}
              />

              <FormInput
                name="name"
                control={control}
                label="Full Name"
                placeholder="Enter your full name"
                autoCapitalize="words"
                error={errors.name}
              />

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
                name="phoneNumber"
                control={control}
                label="Phone Number"
                placeholder="Enter 10-digit phone number"
                keyboardType="phone-pad"
                error={errors.phoneNumber}
              />

              <FormInput
                name="referralCode"
                control={control}
                label="Referral Code (Optional)"
                placeholder="Enter referral code"
                error={errors.referralCode}
              />

              <LoadingButton
                title="Sign Up"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                className="mt-8 w-full"
              />

              {/* Login Link */}
              <View className="flex-row justify-center pt-6">
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text className="text-sm font-semibold text-black dark:text-white">Log in</Text>
                </TouchableOpacity>
              </View>
            </View>

            <SocialLoginButtons onLoading={setSocialLoading} className="pb-8 pt-10" />
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Signup;
