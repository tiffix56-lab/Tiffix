import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const Categories = () => {
  const { colorScheme } = useColorScheme();

  return (
    <View className="pb-6">
      <View className="mb-6 flex-row items-center justify-center">
        <Text
          className="text-2xl font-semibold text-black dark:text-white"
          style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Top Categories
        </Text>
      </View>

      <View className="flex flex-row gap-2  px-6">
        {/* Vendor Food Card */}
        <TouchableOpacity className="flex-1" onPress={() => router.push('/vendor-food')}>
          <View className="relative h-64 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            <Image
              source={require('@/assets/category-1.png')}
              style={{ height: '100%', width: '100%', resizeMode: 'cover' }}
            />
            <View className="absolute inset-0 rounded-xl bg-black/20" />

            {/* Discount Badge - Top Right */}
            {/* <View className="absolute right-3 top-3">
              <View className="rounded-lg bg-orange-500 px-2 py-1">
                <Text
                  className="text-xs font-semibold text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  22% off
                </Text>
              </View>
            </View> */}

            {/* Gradient Background Section */}
            <View className="absolute bottom-0 left-0 right-0">
              <LinearGradient
                colors={
                  colorScheme === 'dark'
                    ? ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']
                    : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.98)']
                }
                className="rounded-b-xl px-3 py-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold text-black dark:text-white"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Tiffix signature meals
                    </Text>
                  </View>
                  <View className="rounded-full bg-black p-2 dark:bg-white">
                    <Feather
                      name="arrow-up-right"
                      size={16}
                      color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'}
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </TouchableOpacity>

        {/* Home Chef's Card */}
        <TouchableOpacity className="flex-1" disabled>
          <View className="relative h-64 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            <Image
              source={require('@/assets/category-2.png')}
              style={{ height: '100%', width: '100%', resizeMode: 'cover' }}
            />
            <View className="absolute inset-0 rounded-xl bg-black/60 top-0 left-0" />

            <View className="absolute inset-0 flex items-center justify-center">
              <View className="rounded-lg bg-white px-2 py-1">
                <Text
                  className="text-lg font-semibold text-black"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Coming Soon
                </Text>
              </View>
            </View>

            {/* Gradient Background Section */}
            <View className="absolute bottom-0 left-0 right-0">
              <LinearGradient
                colors={
                  colorScheme === 'dark'
                    ? ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']
                    : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.98)']
                }
                className="rounded-b-xl px-3 py-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold text-black dark:text-white"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Coming Soon
                    </Text>
                  </View>
                  <View className="rounded-full bg-black p-2 dark:bg-white">
                    <Feather
                      name="arrow-up-right"
                      size={16}
                      color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'}
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Categories;
