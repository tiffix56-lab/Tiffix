import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const OrderConfirmed = () => {
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="bg-zinc-50 px-6 pb-6 pt-24 dark:bg-neutral-900">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.push('/home')}
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
              Order Confirmed
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Success Message */}
          <View className="items-center px-6 pb-8 pt-8">
            {/* Checkmark Icon */}
            <Image
              source={require('../../assets/confirmation-tick.png')}
              className="my-8 h-40 w-40"
              resizeMode="contain"
            />

            {/* Thank You Text */}
            <Text
              className="mb-2 text-3xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Thank you!
            </Text>
            <Text
              className="text-center text-base text-zinc-500 dark:text-zinc-400"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              Your order has been placed sent to Tiffix
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Back to Home Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={() => router.push('/home')}
          className="rounded-xl bg-black py-4 dark:bg-white">
          <Text
            className="text-center text-lg font-semibold text-white dark:text-black"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderConfirmed;
