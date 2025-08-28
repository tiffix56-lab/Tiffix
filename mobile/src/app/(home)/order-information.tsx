import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const OrderInformation = () => {
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="bg-zinc-50 px-6 pb-6 pt-24 dark:bg-neutral-900">
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
              Order Information
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Illustration Section */}
          <Image
            source={require('../../assets/order-information.png')}
            className="my-8 h-48 w-full"
            resizeMode="contain"
          />

          {/* Order Details Card */}
          <View className="mx-6 mb-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
            {/* Subscription Details */}
            <View className="mb-4">
              <View className="mb-3 flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Subscription Plan :
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  1 year
                </Text>
              </View>
              <View className="mb-3 flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Date :
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  17 May
                </Text>
              </View>
              <View className="mb-3 flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Time :
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  12:00pm/08:00pm
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Address :
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Home
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="mb-4 h-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Price Breakdown */}
            <View className="mb-4">
              <View className="mb-3 flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Price :
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  ₹42000
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Tax :
                </Text>
                <Text
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  ₹392
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="mb-4 h-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Total */}
            <View className="flex-row justify-between">
              <Text
                className="text-lg font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Total :
              </Text>
              <Text
                className="text-lg font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                ₹42392
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Confirm Order Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={() => router.push('/order-confirmed')}
          className="rounded-xl bg-black py-4 dark:bg-white">
          <Text
            className="text-center text-lg font-semibold text-white dark:text-black"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Confirm Order
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderInformation;
