import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { menuService } from '@/services/menu.service';
import { MenuItem } from '@/types/menu.types';

const { width, height } = Dimensions.get('window');

const MealDetails = () => {
  const { colorScheme } = useColorScheme();
  const { id } = useLocalSearchParams();
  const [isLiked, setIsLiked] = useState(false);
  const [menu, setMenu] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchMenuDetails(id as string);
    }
  }, [id]);

  const fetchMenuDetails = async (menuId: string) => {
    try {
      setLoading(true);
      const response = await menuService.getMenuById(menuId);
      
      if (response.success && response.data) {
        setMenu(response.data.menu);
      } else {
        setError('Menu not found');
      }
    } catch (err) {
      setError('Failed to load menu details');
      console.error('Error fetching menu details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const parseMealComponents = (detailedItemList: string) => {
    // Parse the detailed item list into structured components
    const items = detailedItemList.split(',').map(item => item.trim());
    return [
      {
        category: 'Meal Components',
        items: items.map(item => ({
          name: item,
          type: 'Item'
        }))
      }
    ];
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-50 dark:bg-neutral-900">
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
        <Text className="mt-4 text-base text-zinc-500 dark:text-zinc-400">Loading meal details...</Text>
      </View>
    );
  }

  if (error || !menu) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-50 dark:bg-neutral-900">
        <Feather name="alert-circle" size={48} color={colorScheme === 'dark' ? '#EF4444' : '#DC2626'} />
        <Text className="mt-4 text-center text-lg font-medium text-zinc-600 dark:text-zinc-300">
          {error || 'Menu not found'}
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-4 rounded-xl bg-black px-6 py-3 dark:bg-white"
        >
          <Text className="text-white font-medium dark:text-black">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mealComponents = parseMealComponents(menu.detailedItemList);
  const isVegetarian = menu.dietaryOptions?.includes('vegetarian');

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
            source={{ uri: menu.foodImage }}
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
                {menu.foodTitle}
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-3 flex-row items-center rounded-full bg-yellow-100 px-3 py-1 dark:bg-yellow-900/20">
                    <Text className="mr-1 text-lg text-yellow-600 dark:text-yellow-400">★</Text>
                    <Text
                      className="text-base font-semibold text-yellow-600 dark:text-yellow-400"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {menu.rating.average.toFixed(1)}
                    </Text>
                  </View>
                  <Text
                    className="text-base text-gray-500 dark:text-gray-400"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    ({menu.rating.totalReviews} reviews)
                  </Text>
                </View>
                <View className="flex-row items-center space-x-2">
                  <View className={`rounded-full px-3 py-1 ${
                    isVegetarian 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    <Text
                      className={`text-sm font-medium ${
                        isVegetarian 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      {isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                    </Text>
                  </View>
                  <Text
                    className="text-2xl font-bold text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_700Bold' }}>
                    {formatCurrency(menu.price)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <Text
              className="mb-6 text-left text-base leading-6 text-gray-700 dark:text-gray-300"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              {menu.description.long || menu.description.short}
            </Text>

            {/* Quick Info */}
            <View className="mb-6 flex-row items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <View className="flex-row items-center">
                <Feather name="clock" size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text
                  className="ml-2 text-sm text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  {menu.prepTime} min
                </Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="zap" size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text
                  className="ml-2 text-sm text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  {menu.calories} cal
                </Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="map-pin" size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text
                  className="ml-2 text-sm text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  {menu.cuisine}
                </Text>
              </View>
            </View>

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
