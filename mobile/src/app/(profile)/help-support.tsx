import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const HelpSupport = () => {
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
              Help and Support
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          <Text
            className="mb-4 text-lg font-semibold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Help and Support
          </Text>
          <Text
            className="text-base leading-6 text-gray-600 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            Lorem ipsum dolor sit amet consectetur. Sit pulvinar mauris mauris eu nibh semper nisl
            pretium laoreet. Sed non faucibus ac lectus eu arcu. Nulla sit congue facilisis
            vestibulum egestas nisl feugiat pharetra. Odio sit tortor morbi at orci ipsum dapibus
            interdum. Lorem felis est aliquet arcu nullam pellentesque. Et habitasse ac arcu et nunc
            euismod rhoncus facilisis sollicitudin.
          </Text>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default HelpSupport;
