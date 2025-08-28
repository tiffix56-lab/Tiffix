import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const VendorFood = () => {
  const { colorScheme } = useColorScheme();
  const [selectedMeals, setSelectedMeals] = useState(0);
  const [selectedDay, setSelectedDay] = useState('Mon');

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleMealSelection = () => {
    setSelectedMeals(selectedMeals === 0 ? 1 : 0);
  };

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
              Vendor Food
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Meal Cards */}
          {[1, 2, 3, 4, 5].map((index) => (
            <View key={index} className="mb-4 rounded-xl bg-white p-4 shadow-sm dark:bg-zinc-900">
              <View className="flex-row">
                {/* Meal Image */}
                <View className="mr-4">
                  <Image
                    source={require('@/assets/category-1.png')}
                    className="h-20 w-20 rounded-full"
                    resizeMode="cover"
                  />
                </View>

                {/* Meal Details */}
                <View className="flex-1">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text
                        className="text-lg font-semibold text-black dark:text-white"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Premium Thali
                      </Text>
                      <Text
                        className="text-base text-black dark:text-white"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        ₹199/Meal
                      </Text>
                      <View className="mt-1 flex-row items-center">
                        <Text className="text-yellow-500">★</Text>
                        <Text
                          className="ml-1 text-sm text-zinc-500 dark:text-zinc-400"
                          style={{ fontFamily: 'Poppins_400Regular' }}>
                          4.7 (34 reviews)
                        </Text>
                      </View>
                    </View>

                    {/* Non-Vegetarian Indicator */}
                    <View className="rounded-md border border-red-500 bg-red-50 px-2 py-1 dark:bg-red-900/20">
                      <Text
                        className="text-xs font-medium text-red-700 dark:text-red-400"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        NON-VEG
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="mt-4 flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 rounded-lg border border-zinc-200 bg-white py-2 dark:border-zinc-700 dark:bg-zinc-800"
                      onPress={() => router.push('/meal-details')}>
                      <Text
                        className="text-center text-sm font-medium text-black dark:text-white"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        View Details
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push('/subscription')}
                      className="flex-1 rounded-lg bg-black py-2 dark:bg-white">
                      <Text
                        className="text-center text-sm font-medium text-white dark:text-black"
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        Select Meal
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default VendorFood;
