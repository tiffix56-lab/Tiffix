import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const Address = () => {
  const { colorScheme } = useColorScheme();

  const addresses = [
    {
      id: '1',
      type: 'Home',
      address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    },
    {
      id: '2',
      type: 'Home',
      address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    },
    {
      id: '3',
      type: 'Home',
      address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    },
    {
      id: '4',
      type: 'Home',
      address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    },
    {
      id: '5',
      type: 'Home',
      address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    },
    {
      id: '6',
      type: 'Home',
      address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    },
  ];

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
              Address
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Address List */}
          <View className="space-y-4">
            {addresses.map((address) => (
              <View key={address.id} className={`mb-2 rounded-lg  p-4 `}>
                <View className="flex-row items-start">
                  <View className="mr-3 mt-1">
                    <Feather
                      name="map-pin"
                      size={16}
                      color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="mb-1 text-base font-semibold text-black dark:text-white"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {address.type}
                    </Text>
                    <Text
                      className="text-sm text-gray-600 dark:text-gray-300"
                      style={{ fontFamily: 'Poppins_400Regular' }}>
                      {address.address}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Add New Address Button */}
          <TouchableOpacity className="mt-8 rounded-lg bg-black py-4 dark:bg-white">
            <Text
              className="text-center text-base font-medium text-white dark:text-black"
              style={{ fontFamily: 'Poppins_500Medium' }}>
              Add new address
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Address;
