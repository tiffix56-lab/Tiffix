import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import ThemeToggle from '@/components/ui/ThemeToggle';

const OTP = () => {
  const { colorScheme } = useColorScheme();
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(56);
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
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
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
          {/* Verification Section */}
          <View className="mb-10 items-center">
            <Text className="mb-4 text-3xl font-semibold text-black dark:text-white">
              Verification
            </Text>
            <Text className="text-center text-base leading-6 text-zinc-500 dark:text-zinc-400">
              6-digits pin has been sent to your email{'\n'}address,mukulparmar470@gmail.com
            </Text>
          </View>

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
                Didn't receive code?
              </Text>
              <TouchableOpacity>
                <Text className="text-base font-semibold text-black dark:text-white">
                  Resend Code
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity className="mb-8 rounded-3xl bg-black py-4 dark:bg-white">
            <Text className="text-center text-lg font-medium text-white dark:text-black">
              Verify
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default OTP;
