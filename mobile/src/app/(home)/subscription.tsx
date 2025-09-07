import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { subscriptionService, Subscription as SubscriptionType } from '@/services/subscription.service';
import { useAddress } from '@/context/AddressContext';

const Subscription = () => {
  const { colorScheme } = useColorScheme();
  const { menuId } = useLocalSearchParams();
  const { selectedAddress } = useAddress();
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Show warning if no address is selected
  useEffect(() => {
    if (!selectedAddress) {
      setError('Please select a delivery address first to view available plans');
    }
  }, [selectedAddress]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getActiveSubscriptions({ limit: 50 });
      
      if (response.success && response.data) {
        const subscriptions = response.data.subscriptions;
        console.log('Fetched subscriptions:', subscriptions);
        setSubscriptions(subscriptions);
        // Auto-select first subscription
        if (subscriptions.length > 0) {
          setSelectedPlan(subscriptions[0]._id);
        } else {
          console.log('No subscriptions found');
          setError('No subscription plans available');
        }
      } else {
        setError(response.message || 'Failed to load subscription plans');
      }
    } catch (err) {
      setError('Failed to load subscription plans');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = subscriptions.find((plan) => plan._id === selectedPlan);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getSavings = (originalPrice: number, discountedPrice: number) => {
    return originalPrice - discountedPrice;
  };

  const calculateTax = (price: number) => {
    return Math.round(price * 0.18); // 18% GST
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
              Subscription
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
            <Text className="mt-4 text-base text-zinc-500 dark:text-zinc-400">Loading subscription plans...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text className="mt-4 text-center text-base text-red-500">{error}</Text>
            <TouchableOpacity
              onPress={fetchSubscriptions}
              className="mt-4 rounded-lg bg-black px-6 py-3 dark:bg-white">
              <Text className="text-sm font-medium text-white dark:text-black">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : subscriptions.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Feather name="package" size={48} color="#71717A" />
            <Text className="mt-4 text-center text-base text-zinc-500 dark:text-zinc-400">
              No subscription plans available at the moment
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
            {/* Choose Your Plan */}
            <Text
              className="mb-6 text-2xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Choose Your Plan
            </Text>

            {/* Plan Cards */}
            {subscriptions.map((plan) => {
              const savings = getSavings(plan.originalPrice, plan.discountedPrice);
              const isSelected = selectedPlan === plan._id;
              
              return (
                <TouchableOpacity
                  key={plan._id}
                  onPress={() => setSelectedPlan(plan._id)}
                  className={`mb-4 rounded-xl p-4 ${
                    isSelected
                      ? 'border border-zinc-200 bg-neutral-900 dark:border-zinc-700 dark:bg-neutral-900'
                      : 'border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-black'
                  }`}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-4">
                      <View className="mb-2 flex-row items-center flex-wrap">
                        <Text
                          className={`text-xl font-semibold ${
                            isSelected
                              ? 'text-zinc-50 dark:text-zinc-50'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                          style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {plan.planName}
                        </Text>
                      </View>
                      {(plan.duration === 'yearly' || plan.duration === 'monthly') && (
                        <View className="mb-2">
                          <View className="rounded-full bg-blue-500 px-3 py-1 self-start">
                            <Text
                              className="text-xs font-medium text-zinc-50"
                              style={{ fontFamily: 'Poppins_600SemiBold' }}>
                              {plan.duration === 'yearly' ? 'BEST VALUE' : 'POPULAR'}
                            </Text>
                          </View>
                        </View>
                      )}
                      <Text
                        className={`text-base ${
                          isSelected
                            ? 'text-zinc-50 dark:text-zinc-50'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        No. of meals: {plan.mealsPerPlan} meals
                      </Text>
                      {plan.freeDelivery && (
                        <Text
                          className={`text-base ${
                            isSelected
                              ? 'text-green-400 dark:text-green-600'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                          style={{ fontFamily: 'Poppins_500Medium' }}>
                          Delivery Free
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text
                        className={`text-lg line-through ${
                          isSelected
                            ? 'text-zinc-500 dark:text-zinc-400'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        {formatCurrency(plan.originalPrice)}
                      </Text>
                      <Text
                        className={`text-2xl font-semibold ${
                          isSelected
                            ? 'text-green-400 dark:text-green-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                        style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {formatCurrency(plan.discountedPrice)}
                      </Text>
                      <Text
                        className={`text-sm capitalize ${
                          isSelected
                            ? 'text-zinc-500 dark:text-zinc-400'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                        style={{ fontFamily: 'Poppins_500Medium' }}>
                        {plan.duration === 'yearly' ? 'Yearly' : plan.duration === 'monthly' ? 'Monthly' : 'Quarterly'}
                      </Text>
                    </View>
                  </View>
                  {savings > 0 && (
                    <Text
                      className={`mt-2 text-sm ${
                        isSelected
                          ? 'text-green-400 dark:text-green-600'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      You Save: {formatCurrency(savings)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Price Summary */}
            {selectedPlanData && (
              <View className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <View className="mb-2 flex-row justify-between">
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Price:
                  </Text>
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {formatCurrency(selectedPlanData.discountedPrice)}
                  </Text>
                </View>
                <View className="mb-2 flex-row justify-between">
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Tax (18% GST):
                  </Text>
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {formatCurrency(calculateTax(selectedPlanData.discountedPrice))}
                  </Text>
                </View>
                <View className="border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <View className="flex-row justify-between">
                    <Text
                      className="text-lg font-semibold text-black dark:text-white"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Total:
                    </Text>
                    <Text
                      className="text-lg font-semibold text-black dark:text-white"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {formatCurrency(selectedPlanData.discountedPrice + calculateTax(selectedPlanData.discountedPrice))}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Subscription Terms */}
            {selectedPlanData && (
              <View className="mb-8 mt-6">
                <Text
                  className="text-xs leading-4 text-zinc-500 dark:text-zinc-400"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  {selectedPlanData.terms || 'Payment will be charged at confirmation of purchase. Subscriptions automatically renew unless cancelled. You can manage your subscription and turn off auto-renewal by going to your account settings.'}
                </Text>
              </View>
            )}

            {/* Bottom Spacing */}
            <View className="h-20" />
          </ScrollView>
        )}
      </View>

      {/* Confirm Button */}
      {!loading && selectedPlanData && (
        <View className="px-6 pb-6">
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(home)/information',
              params: {
                subscriptionId: selectedPlan,
                menuId: menuId || ''
              }
            })}
            className="rounded-xl bg-black py-4 dark:bg-white">
            <Text
              className="text-center text-lg font-semibold text-white dark:text-black"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Confirm Plan
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Subscription;