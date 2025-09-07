import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { menuService } from '@/services/menu.service';
import { MenuItem } from '@/types/menu.types';
import { useAddress } from '@/context/AddressContext';
import { Feather } from '@expo/vector-icons';

const MealSubscriptions = () => {
  const { colorScheme } = useColorScheme();
  const { selectedAddress, savedAddresses, isServiceableAddress } = useAddress();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filteredMenus, setFilteredMenus] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchTopMenus();
  }, []);

  useEffect(() => {
    filterMenusByAddress();
  }, [menus, selectedAddress]);

  const fetchTopMenus = async () => {
    try {
      setLoading(true);
      const response = await menuService.getMenus({
        isAvailable: true,
        sortBy: 'rating.average',
        sortOrder: 'desc',
        limit: 12 // Increase limit to account for filtering
      });
      
      if (response.success && response.data?.menus) {
        setMenus(response.data.menus);
      } else {
        setError('Failed to load meals');
      }
    } catch (err) {
      console.error('Error fetching menus:', err);
      setError('Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const filterMenusByAddress = () => {
    if (!selectedAddress) {
      // If no address selected, show first 6 meals with location prompt
      setFilteredMenus(menus.slice(0, 6));
      return;
    }

    // Check if selected address is serviceable
    if (!isServiceableAddress(selectedAddress)) {
      setFilteredMenus([]);
      return;
    }

    // For now, show all menus since we don't have location-based filtering in API
    // In a real app, you would filter based on delivery zones or coordinates
    const availableMenus = menus.filter(menu => {
      // Simple distance-based filtering (placeholder logic)
      // In production, this would be handled by the backend
      return menu.isAvailable;
    });

    setFilteredMenus(availableMenus.slice(0, 6));
  };

  if (loading) {
    return (
      <View className="pb-6">
        <View className="mb-6 flex-row items-center justify-center">
          <Text
            className="text-2xl font-semibold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Meal Subscriptions
          </Text>
        </View>
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
        </View>
      </View>
    );
  }

  if (!selectedAddress && savedAddresses.length === 0) {
    return (
      <View className="pb-6">
        <View className="mb-6 flex-row items-center justify-center">
          <Text
            className="text-2xl font-semibold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Meal Subscriptions
          </Text>
        </View>
        <View className="mx-6 items-center justify-center rounded-xl border border-dashed border-orange-300 bg-orange-50 py-8 dark:border-orange-600 dark:bg-orange-900/20">
          <Feather name="map-pin" size={32} color={colorScheme === 'dark' ? '#FB923C' : '#EA580C'} />
          <Text
            className="mt-2 text-center text-base font-medium text-orange-700 dark:text-orange-400"
            style={{ fontFamily: 'Poppins_500Medium' }}>
            Add your address to see available meals
          </Text>
          <Text
            className="mt-1 text-center text-sm text-orange-600 dark:text-orange-500"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            Tap the address at the top to get started
          </Text>
        </View>
      </View>
    );
  }

  if (selectedAddress && !isServiceableAddress(selectedAddress)) {
    return (
      <View className="pb-6">
        <View className="mb-6 flex-row items-center justify-center">
          <Text
            className="text-2xl font-semibold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Meal Subscriptions
          </Text>
        </View>
        <View className="mx-6 items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50 py-8 dark:border-red-600 dark:bg-red-900/20">
          <Feather name="alert-circle" size={32} color={colorScheme === 'dark' ? '#F87171' : '#DC2626'} />
          <Text
            className="mt-2 text-center text-base font-medium text-red-700 dark:text-red-400"
            style={{ fontFamily: 'Poppins_500Medium' }}>
            Delivery not available in your area
          </Text>
          <Text
            className="mt-1 text-center text-sm text-red-600 dark:text-red-500"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            We'll be expanding to {selectedAddress.city} soon!
          </Text>
        </View>
      </View>
    );
  }

  if (error || filteredMenus.length === 0) {
    return (
      <View className="pb-6">
        <View className="mb-6 flex-row items-center justify-center">
          <Text
            className="text-2xl font-semibold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Meal Subscriptions
          </Text>
        </View>
        <View className="items-center justify-center py-8">
          <Text className="text-center text-base text-zinc-500 dark:text-zinc-400">
            {error || (selectedAddress ? `No meals available in ${selectedAddress.city}` : 'No meals available at the moment')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="pb-6">
      <View className="mb-6 flex-row items-center justify-center">
        <Text
          className="text-2xl font-semibold text-black dark:text-white"
          style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Meal Subscriptions
        </Text>
      </View>

      <View className="px-6">
        <View className="flex-row flex-wrap justify-between">
          {filteredMenus.map((menu, index) => (
            <View key={menu._id + index} className="mb-6 w-[30%] items-center">
              <TouchableOpacity 
                className="items-center"
                onPress={() => {
                  if (!selectedAddress) {
                    // Prompt to select address first
                    return;
                  }
                  router.push({
                    pathname: '/(home)/meal-details',
                    params: { id: menu._id }
                  });
                }}>
                <View className="relative">
                  <Image 
                    source={{ uri: menu.foodImage }} 
                    className="h-20 w-20 rounded-full" 
                    defaultSource={require('@/assets/category-1.png')}
                  />
                  <View className="absolute inset-0 rounded-full bg-black/10" />
                  
                  {/* Rating Badge */}
                  <View className="absolute -top-1 -right-1 rounded-full bg-yellow-500 px-1.5 py-0.5">
                    <Text 
                      className="text-xs font-medium text-white" 
                      style={{ fontSize: 8, fontFamily: 'Poppins_600SemiBold' }}>
                      ★{menu.rating.average.toFixed(1)}
                    </Text>
                  </View>
                </View>
                <Text
                  className="mt-2 text-center text-sm font-medium text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}
                  numberOfLines={2}>
                  {menu.foodTitle}
                </Text>
                <Text
                  className="text-xs text-green-600 dark:text-green-400"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  ₹{menu.price}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default MealSubscriptions;
