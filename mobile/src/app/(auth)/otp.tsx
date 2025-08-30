import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { LoadingButton } from '@/components/common/LoadingButton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useAuth } from '@/context/AuthContext';
import { formatOTP, isValidOTPFormat, maskEmail } from '@/utils/format.utils';

const OTP = () => {
  const { colorScheme } = useColorScheme();
  const { verifyEmail, resendOTP, isLoading } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const emailAddress = params?.email || '';
  
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (text: string, index: number) => {
    setError('');
    const formattedText = formatOTP(text);
    const newPin = [...pin];
    newPin[index] = formattedText;
    setPin(newPin);

    if (formattedText && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (formattedText && index === 5) {
      const otpString = [...newPin.slice(0, 5), formattedText].join('');
      if (isValidOTPFormat(otpString)) {
        handleVerifyOTP(otpString);
      }
    }
  };

  const handleBackspace = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const otpString = otpCode || pin.join('');
    
    if (!isValidOTPFormat(otpString)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!emailAddress) {
      setError('Email address not found. Please go back and try again.');
      return;
    }

    const result = await verifyEmail({
      emailAddress,
      otp: otpString,
    });

    if (result.success) {
      router.replace('/(tabs)/home');
    } else {
      setError(result.message);
      setPin(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (!emailAddress) {
      setError('Email address not found. Please go back and try again.');
      return;
    }

    setIsResending(true);
    setError('');
    
    const result = await resendOTP(emailAddress);
    
    if (result.success) {
      setCountdown(60);
      setPin(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } else {
      setError(result.message);
    }
    
    setIsResending(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            <Text className="text-3xl font-semibold text-black dark:text-white">OTP</Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          <View className="mb-10 items-center">
            <Text className="mb-4 text-3xl font-semibold text-black dark:text-white">
              Verification
            </Text>
            <Text className="text-center text-base leading-6 text-zinc-500 dark:text-zinc-400">
              6-digits pin has been sent to your email{'\n'}address, {maskEmail(emailAddress)}
            </Text>
          </View>

          <ErrorMessage message={error} visible={!!error} className="mb-6" />

          {/* OTP Input */}
          <View className="mb-10 flex-row justify-between px-4">
            {pin.map((digit, index) => (
              <View key={index} className="relative">
                <TextInput
                  ref={(input) => {
                    if (input) {
                      inputs.current[index] = input;
                    }
                  }}
                  className={`h-12 w-12 rounded-md border border-zinc-100 bg-zinc-50 text-center text-xl font-semibold dark:border-zinc-400 dark:bg-black ${
                    digit ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleBackspace(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                />
              </View>
            ))}
          </View>

          {/* Countdown Timer */}
          <View className="mb-10 items-center">
            <Text className="mb-6 text-3xl font-semibold text-black dark:text-white">
              {formatTime(countdown)}
            </Text>
            <View className="flex-row">
              <Text className="text-base text-zinc-500 dark:text-zinc-400">
                Didn&apos;t receive code?
              </Text>
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={countdown > 0 || isResending}
              >
                <Text className={`ml-2 text-base font-semibold ${
                  countdown > 0 || isResending
                    ? 'text-zinc-400 dark:text-zinc-600'
                    : 'text-black dark:text-white'
                }`}>
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <LoadingButton
            title="Verify"
            onPress={() => handleVerifyOTP()}
            loading={isLoading}
            disabled={!pin.join('') || pin.join('').length < 6}
            className="mb-8 w-full"
          />
        </ScrollView>
      </View>
    </View>
  );
};

export default OTP;
