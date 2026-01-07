import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { subscriptionService, Subscription } from '@/services/subscription.service';
import { useAddress } from '@/context/AddressContext';
import { Feather } from '@expo/vector-icons';

const MealSubscriptions = () => {
  const { colorScheme } = useColorScheme();
  const { selectedAddress, savedAddresses, isServiceableAddress } = useAddress();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getActiveSubscriptions({
        category: 'food_vendor',
      });

      if (response.success && response.data?.subscriptions) {
        setSubscriptions(response.data.subscriptions);
      } else {
        setError('Failed to load subscriptions');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
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

  if (error || subscriptions.length === 0) {
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
            {error || (selectedAddress ? `No subscriptions available in ${selectedAddress.city}` : 'No subscriptions available at the moment')}
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
        <View className="flex-row flex-wrap gap-3 border-white">
          {subscriptions.slice(0, 6).map((plan, index) => (
            <View key={plan._id + index} className="mb-6 w-[30%] items-center border-white">
              <TouchableOpacity
                className="items-center"
                onPress={() => {
                  if (!selectedAddress) {
                    // Prompt to select address first
                    return;
                  }
                  router.push({
                    pathname: '/(home)/subscription',
                    params: { menuId: plan._id },
                  });
                }}>
                <View className="relative">
                  <Image
                    source={plan.image ? { uri: plan.image } : require('@/assets/category-1.png')}
                    style={{ height: 80, width: 80, borderRadius: 40 }}
                    defaultSource={require('@/assets/category-1.png')}
                  />
                  <View className="absolute inset-0 rounded-full bg-black/10" />
                </View>
                <Text
                  className="mt-2 text-center text-sm font-medium text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}
                  numberOfLines={2}>
                  {plan.planName}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
      {!selectedAddress && <TouchableOpacity onPress={() => router.push('/(profile)/address')} className="pb-6">
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
      </TouchableOpacity>}
    </View>
  );
};

export default MealSubscriptions;
