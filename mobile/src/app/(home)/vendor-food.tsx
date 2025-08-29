import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { menuService } from '@/services/menu.service';
import { MenuItem } from '@/types/menu.types';

const VendorFood = () => {
  const { colorScheme } = useColorScheme();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchVendorMenus();
  }, []);

  const fetchVendorMenus = async () => {
    try {
      setLoading(true);
      const response = await menuService.getVendorMenus({
        isAvailable: true,
        sortBy: 'rating.average',
        sortOrder: 'desc'
      });
      
      if (response.success && response.data) {
        setMenus(response.data.menus);
      } else {
        setError(response.message || 'Failed to load menu');
      }
    } catch (err) {
      setError('Failed to load menu');
      console.error('Error fetching vendor menus:', err);
    } finally {
      setLoading(false);
    }
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
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            <Text className="mt-4 text-base text-zinc-500 dark:text-zinc-400">Loading menu...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text className="mt-4 text-center text-base text-red-500">{error}</Text>
            <TouchableOpacity
              onPress={fetchVendorMenus}
              className="mt-4 rounded-lg bg-black px-6 py-3 dark:bg-white">
              <Text className="text-sm font-medium text-white dark:text-black">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : menus.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Feather name="package" size={48} color="#71717A" />
            <Text className="mt-4 text-center text-base text-zinc-500 dark:text-zinc-400">
              No vendor meals available at the moment
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
            {/* Meal Cards */}
            {menus.map((menu) => {
              const isVegetarian = menu.dietaryOptions.includes('vegetarian');
              const isNonVeg = menu.dietaryOptions.includes('non-vegetarian');
              
              return (
                <View key={menu._id} className="mb-4 rounded-xl bg-white p-4 shadow-sm dark:bg-zinc-900">
                  <View className="flex-row">
                    {/* Meal Image */}
                    <View className="mr-4">
                      <Image
                        source={menu.foodImage ? { uri: menu.foodImage } : require('@/assets/category-1.png')}
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
                            {menu.foodTitle}
                          </Text>
                          <Text
                            className="text-base text-black dark:text-white"
                            style={{ fontFamily: 'Poppins_500Medium' }}>
                            ₹{menu.price}/Meal
                          </Text>
                          <View className="mt-1 flex-row items-center">
                            <Text className="text-yellow-500">★</Text>
                            <Text
                              className="ml-1 text-sm text-zinc-500 dark:text-zinc-400"
                              style={{ fontFamily: 'Poppins_400Regular' }}>
                              {menu.rating.average.toFixed(1)} ({menu.rating.totalReviews} reviews)
                            </Text>
                          </View>
                          <Text
                            className="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
                            style={{ fontFamily: 'Poppins_400Regular' }}>
                            {menu.description.short}
                          </Text>
                        </View>

                        {/* Dietary Indicator */}
                        {(isVegetarian || isNonVeg) && (
                          <View className={`rounded-md border px-2 py-1 ${
                            isVegetarian 
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          }`}>
                            <Text
                              className={`text-xs font-medium ${
                                isVegetarian 
                                  ? 'text-green-700 dark:text-green-400' 
                                  : 'text-red-700 dark:text-red-400'
                              }`}
                              style={{ fontFamily: 'Poppins_500Medium' }}>
                              {isVegetarian ? 'VEG' : 'NON-VEG'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action Buttons */}
                      <View className="mt-4 flex-row gap-3">
                        <TouchableOpacity
                          className="flex-1 rounded-lg border border-zinc-200 bg-white py-2 dark:border-zinc-700 dark:bg-zinc-800"
                          onPress={() => router.push({
                            pathname: '/meal-details',
                            params: { id: menu._id }
                          })}>
                          <Text
                            className="text-center text-sm font-medium text-black dark:text-white"
                            style={{ fontFamily: 'Poppins_500Medium' }}>
                            View Details
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => router.push({
                            pathname: '/subscription',
                            params: { menuId: menu._id }
                          })}
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
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default VendorFood;
