import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const PrivacyPolicy = () => {
  const { colorScheme } = useColorScheme();

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
              Privacy Policy
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          
          <Text className="mb-2 text-base text-gray-600 dark:text-gray-300" style={{ fontFamily: 'Poppins_400Regular' }}>
            Last Updated: August 2025
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            Tiffix (“we,” “our,” or “us”) values your trust and is committed to protecting your personal information.
            This Privacy Policy explains how we collect, use, and safeguard your data when you use our mobile application, website, and related services.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>1. Information We Collect</Text>
          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            • Personal details (name, phone number, address, email){"\n"}
            • Order details & veg preferences{"\n"}
            • Payment info (processed securely; we do not store card/bank data){"\n"}
            • Device & usage data, location for delivery
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>2. How We Use Your Information</Text>
          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            • Deliver orders{"\n"}
            • Improve services{"\n"}
            • Send updates/offers{"\n"}
            • Meet legal requirements
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>3. Data Sharing</Text>
          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            We do not sell your data. We only share with{"\n"}
            • Delivery partners{"\n"}
            • Payment processors{"\n"}
            • Service providers (analytics/support){"\n"}
            • Legal authorities
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>4. Non-Vegetarian Meals</Text>
          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            We currently only serve vegetarian meals. If this changes, we will update this policy.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>5. Data Security</Text>
          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            We use standard security measures to protect your data.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>6. Your Rights</Text>
          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            Email support@tiffix.in to access, correct, or delete your data.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>7. Children’s Privacy</Text>
          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            We do not knowingly collect information from children under 13.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>8. Policy Updates</Text>
          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            Policy may change. Updated version will be posted with date.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>9. Contact</Text>
          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            support@tiffix.in{"\n"}
            Tiffix, Indore, MP, India
          </Text>

          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default PrivacyPolicy;
