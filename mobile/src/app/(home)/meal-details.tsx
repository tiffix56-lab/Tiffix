import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const MealDetails = () => {
  const { colorScheme } = useColorScheme();
  const [isLiked, setIsLiked] = useState(false);

  const mealComponents = [
    {
      category: 'Main Course',
      items: [
        { name: '4 Roti', type: 'Bread' },
        { name: 'Aloo Gobi', type: 'Vegetable' },
        { name: 'Seasonal Sabji', type: 'Vegetable' },
      ],
    },
    {
      category: 'Accompaniments',
      items: [
        { name: 'Salad', type: 'Fresh' },
        { name: 'Chawal', type: 'Rice' },
        { name: 'Raita', type: 'Dairy' },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="absolute left-6 right-6 top-12 z-20">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm dark:bg-black/20">
            <Feather
              name="arrow-left"
              size={20}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#1F2937'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLiked(!isLiked)}
            className="h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm dark:bg-black/20">
            <Feather
              name="heart"
              size={20}
              color={isLiked ? '#EF4444' : colorScheme === 'dark' ? '#FFFFFF' : '#1F2937'}
              fill={isLiked ? '#EF4444' : 'none'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View className="h-[500px] w-full">
          <Image
            source={require('@/assets/category-2.png')}
            className="h-full w-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              'transparent',
              'transparent',
              'rgba(0,0,0,0.2)',
              'rgba(0,0,0,0.4)',
              'rgba(0,0,0,0.6)',
              'rgba(0,0,0,0.8)',
            ]}
            className="absolute inset-0"
          />
        </View>

        {/* Main Content */}
        <View className="-mt-16 flex-1">
          <View className="rounded-t-3xl bg-white p-6 dark:bg-neutral-900">
            {/* Title and Rating Section */}
            <View className="mb-6">
              <Text
                className="mb-3 text-left text-3xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Special Thali
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-3 flex-row items-center rounded-full bg-yellow-100 px-3 py-1 dark:bg-yellow-900/20">
                    <Text className="mr-1 text-lg text-yellow-600 dark:text-yellow-400">★</Text>
                    <Text
                      className="text-base font-semibold text-yellow-600 dark:text-yellow-400"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      4.9
                    </Text>
                  </View>
                  <Text
                    className="text-base text-gray-500 dark:text-gray-400"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    (27 reviews)
                  </Text>
                </View>
                <View className="flex-row items-center space-x-2">
                  <View className="rounded-full bg-green-100 px-3 py-1 dark:bg-green-900/20">
                    <Text
                      className="text-sm font-medium text-green-600 dark:text-green-400"
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      Vegetarian
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Description */}
            <Text
              className="mb-6 text-left text-base leading-6 text-gray-700 dark:text-gray-300"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              A wholesome and nutritious Indian thali featuring fresh vegetables, whole grains, and
              traditional accompaniments. Perfectly balanced for a complete meal experience.
            </Text>

            <View className="mb-6 h-px bg-gray-200 dark:bg-gray-700" />

            {/* Meal Components */}
            <View className="mb-6">
              <Text
                className="mb-4 text-xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                What's Included
              </Text>

              {mealComponents.map((section, sectionIndex) => (
                <View key={sectionIndex} className="mb-6">
                  <Text
                    className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {section.category}
                  </Text>
                  <View className="gap-1">
                    {section.items.map((item, itemIndex) => (
                      <View
                        key={itemIndex}
                        className="mb-2 flex-row items-center rounded-lg border border-gray-100 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
                        <View className="mr-3 h-3 w-3 rounded-full bg-orange-500" />
                        <View className="flex-1">
                          <Text
                            className="text-base font-medium text-black dark:text-white"
                            style={{ fontFamily: 'Poppins_500Medium' }}>
                            {item.name}
                          </Text>
                          <Text
                            className="text-sm text-gray-500 dark:text-gray-400"
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {item.type}
                          </Text>
                        </View>
                        <View className="rounded-full bg-orange-100 px-2 py-1 dark:bg-orange-900/20">
                          <Text
                            className="text-xs font-medium text-orange-600 dark:text-orange-400"
                            style={{ fontFamily: 'Poppins_500Medium' }}>
                            Included
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View className="mb-6 h-px bg-gray-200 dark:bg-gray-700" />

            {/* Action Button */}
            <TouchableOpacity
              onPress={() => router.push('/subscription')}
              className="mb-8 rounded-xl bg-black py-4 shadow-lg dark:bg-white">
              <Text
                className="text-center text-lg font-semibold text-white dark:text-black"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Add to Subscription
              </Text>
            </TouchableOpacity>

            {/* Bottom spacing for safe area */}
            <View className="h-8" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default MealDetails;
