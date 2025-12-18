import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import LottieView from 'lottie-react-native';

const HelpSupport = () => {
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

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

      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          <LottieView
            source={{ uri: "https://lottie.host/27c6ff31-0092-4fca-87f7-fab7a2a2f392/aHHgDFjqvN.json" }}
            autoPlay
            loop
            style={{ width: '100%', height: 200 }}
          />

          <Text
            className="mb-4 text-lg font-semibold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Help & Support
          </Text>

          <Text
            className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-4"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            At Tiffix, your comfort and experience matter to us. If you ever face an issue with your
            subscription, orders, payments, or delivery, our support team is here to help you
            quickly and professionally.
          </Text>

          <Text className="text-lg font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            What We Can Help You With
          </Text>

          <Text className="text-base text-gray-600 dark:text-gray-300 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            • Subscription Issues: Plan changes, pausing meals, renewals
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-300 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            • Order & Delivery Support: Missing meals, late deliveries, quality concerns
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-300 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            • Payments & Refunds: Payment failures, refund status, billing queries
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-300 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            • Account Assistance: Login issues, profile updates
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-300 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            • General Queries: How Tiffix works, kitchen standards, hygiene, and safety
          </Text>

          <Text className="text-lg font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            How to Reach Us
          </Text>

          <Text className="text-base text-gray-600 dark:text-gray-300 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            📞 Support: Mail your problem; our team will respond shortly during business hours
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-300 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            📧 Email: tiffixhelp@gmail.com
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-300 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            ⏰ Support Hours: 10:00 AM – 08:00 PM
          </Text>

          <Text className="text-lg font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Our Promise
          </Text>

          <Text className="text-base text-gray-600 dark:text-gray-300" style={{ fontFamily: 'Poppins_400Regular' }}>
            We aim to respond quickly, resolve issues smoothly, and ensure every Tiffix meal reaches
            you fresh, hygienic, and on time. If you need help, just reach out — we’re always here
            for you.
          </Text>

          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default HelpSupport;
