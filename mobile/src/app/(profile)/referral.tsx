import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const Referral = () => {
  const { colorScheme } = useColorScheme();
  const [referralCode, setReferralCode] = useState('RkMFucd');

  const copyToClipboard = () => {
    // In a real app, you would use Clipboard API here
    console.log('Copied to clipboard:', referralCode);
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

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
            <Text
              className="text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Referral
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Central Illustration */}
          <View className="mb-8 items-center">
            <Image
              source={require('@/assets/referal-img.png')}
              className="h-80 w-80"
              resizeMode="contain"
            />
          </View>

          {/* Referral Information */}
          <View className="mb-8 items-center">
            <Text
              className="mb-4 text-center text-lg text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Refer a friend and Earn upto $100
            </Text>

            {/* Referral Code Input */}
            <View className="mb-4 w-full">
              <View className="flex-row items-center rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3 dark:border-zinc-600 dark:bg-black ">
                <TextInput
                  value={referralCode}
                  editable={false}
                  className="flex-1 text-base font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                />
                <TouchableOpacity onPress={copyToClipboard} className="ml-2">
                  <Feather
                    name="copy"
                    size={20}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Text
              className="text-center text-sm text-zinc-600 dark:text-zinc-400"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              Invite your friends to join TIFFIX and get upto 10% on each friend order
            </Text>
          </View>

          {/* Invite Now Button */}
          <View className="mb-8">
            <TouchableOpacity className="rounded-lg bg-white py-4 dark:bg-white">
              <Text
                className="text-center text-base font-bold text-black"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                INVITE NOW
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Referral;
