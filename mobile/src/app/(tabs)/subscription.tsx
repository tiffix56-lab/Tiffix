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

const { width } = Dimensions.get('window');

interface Meal {
  id: string;
  name: string;
  description: string;
  image: any;
  date: string;
  time: string;
  isVegetarian: boolean;
  skipCount?: string;
}

interface MealCardProps {
  meal: Meal;
  isUpcoming?: boolean;
}

const Subscription = () => {
  const { colorScheme } = useColorScheme();
  const [activeTab, setActiveTab] = useState('upcoming');

  // Sample data for upcoming meals
  const upcomingMeals: Meal[] = [
    {
      id: '1',
      name: 'Special Thali',
      description: '4 roti/chawal/aloogobi/chole aloo/kadi/salad',
      image: require('@/assets/category-2.png'),
      date: '2025-05-21',
      time: '09:00',
      isVegetarian: true,
      skipCount: '6/6',
    },
    {
      id: '2',
      name: 'Special Thali',
      description: '4 roti/chawal/aloogobi/chole aloo/kadi/salad',
      image: require('@/assets/category-2.png'),
      date: '2025-05-22',
      time: '12:00',
      isVegetarian: true,
      skipCount: '5/6',
    },
  ];

  // Sample data for delivered meals
  const deliveredMeals: Meal[] = [
    {
      id: '3',
      name: 'Special Thali',
      description: '4 roti/chawal/aloogobi/chole aloo/kadi/salad',
      image: require('@/assets/category-2.png'),
      date: '2025-05-20',
      time: '09:00',
      isVegetarian: true,
    },
    {
      id: '4',
      name: 'Special Thali',
      description: '4 roti/chawal/aloogobi/chole aloo/kadi/salad',
      image: require('@/assets/category-2.png'),
      date: '2025-05-19',
      time: '12:00',
      isVegetarian: true,
    },
    {
      id: '5',
      name: 'Special Thali',
      description: '4 roti/chawal/aloogobi/chole aloo/kadi/salad',
      image: require('@/assets/category-2.png'),
      date: '2025-05-18',
      time: '09:00',
      isVegetarian: true,
    },
  ];

  const MealCard: React.FC<MealCardProps> = ({ meal, isUpcoming = false }) => (
    <View className="mb-6 rounded-md bg-white shadow-sm dark:bg-neutral-800">
      <View className="flex-row overflow-hidden ">
        {/* Meal Image - Full Height */}
        <View className="mr-2">
          <Image source={meal.image} className="h-52 w-36 rounded-lg" resizeMode="cover" />
        </View>

        {/* Meal Details */}
        <View className="flex-1 p-2">
          <View className=" flex-row items-center justify-between">
            <Text
              className="mb-1 flex-1 text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {meal.name}
            </Text>
            {meal.isVegetarian && (
              <View className="mb-4 rounded-md border border-lime-500 bg-lime-50 px-2 py-1 dark:bg-lime-900/20">
                <Text
                  className="mb-1 text-xs font-medium text-lime-700 dark:text-lime-400"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  VEG
                </Text>
              </View>
            )}
          </View>

          <Text
            className="mb-4 text-sm text-gray-600 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            {meal.description}
          </Text>

          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather
                name="clock"
                size={16}
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
              />
              <Text
                className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {meal.date} at {meal.time}
              </Text>
            </View>

            {isUpcoming && (
              <TouchableOpacity className="flex-row items-center">
                <Feather
                  name="refresh-cw"
                  size={16}
                  color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Switch
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          {isUpcoming ? (
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 rounded-lg bg-red-500 py-4">
                <Text
                  className="text-center text-sm font-medium text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel Meal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 rounded-lg bg-black py-4 dark:bg-white">
                <Text
                  className="text-center text-base font-medium text-white dark:text-black"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  {meal.skipCount} Skip
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TouchableOpacity className="rounded-lg bg-black py-4 dark:bg-white">
                <Text
                  className="text-center text-base font-medium text-white dark:text-black"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Review Us
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

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
              Subscription
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Tab Navigation */}
          <View className="mb-6">
            <View className="overflow-hidden rounded-full border border-gray-200 bg-gray-100 p-1 shadow-sm dark:border-neutral-700 dark:bg-white">
              <View className="relative flex-row">
                {/* Custom indicator */}
                <View
                  className="absolute rounded-full bg-white shadow-sm dark:bg-black"
                  style={{
                    height: 42,
                    width: '50%',
                    left: activeTab === 'upcoming' ? '0%' : '50%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                    zIndex: 1,
                  }}
                />

                {/* Tab buttons */}
                <TouchableOpacity
                  className="flex-1 rounded-full px-6 py-3"
                  onPress={() => setActiveTab('upcoming')}
                  activeOpacity={0.8}
                  style={{ zIndex: 2 }}>
                  <Text
                    className={`text-center text-base font-semibold ${
                      activeTab === 'upcoming'
                        ? 'text-black dark:text-white'
                        : 'text-gray-600 dark:text-gray-900'
                    }`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Upcoming
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 rounded-full px-6 py-3"
                  onPress={() => setActiveTab('delivered')}
                  activeOpacity={0.8}
                  style={{ zIndex: 2 }}>
                  <Text
                    className={`text-center text-base font-semibold ${
                      activeTab === 'delivered'
                        ? 'text-black dark:text-white'
                        : 'text-gray-600 dark:text-gray-900'
                    }`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Delivered
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Content */}
          {activeTab === 'upcoming' ? (
            <View>
              {upcomingMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} isUpcoming={true} />
              ))}

              {/* Information Notes */}
              <View className="mb-6 gap-2">
                <View className="flex-row items-start">
                  <Feather
                    name="alert-triangle"
                    size={16}
                    color={colorScheme === 'dark' ? '#FCD34D' : '#F59E0B'}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    className="ml-3 flex-1 text-sm text-gray-600 dark:text-gray-300"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Cancelled food doesn't have any refund
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Feather
                    name="refresh-cw"
                    size={16}
                    color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    className="ml-3 flex-1 text-sm text-gray-600 dark:text-gray-300"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Switch between vendor food to home chef & Vice-versa
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View>
              {deliveredMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} isUpcoming={false} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default Subscription;
