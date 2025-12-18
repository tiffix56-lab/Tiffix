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
            Tiffix.com is committed to protecting the privacy of our users. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services. The website is owned by Vishesh Chouhan. By subscribing to our tiffin services, you agree to the terms outlined in this Privacy Policy.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            1. Information We Collect
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            A. Personal Information:{"\n"}
            • Name{"\n"}
            • Email Address{"\n"}
            • Phone Number{"\n"}
            • Delivery Address{"\n"}
            • Payment Information (via secure third-party gateways){"\n\n"}
            B. Non-Personal Information:{"\n"}
            • Browser type and version{"\n"}
            • IP address{"\n"}
            • Device information{"\n"}
            • Usage data (pages viewed, time spent)
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            2. How We Use Your Information
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            • To process your subscription and deliver tiffin services{"\n"}
            • To respond to inquiries and provide customer support{"\n"}
            • To securely process payments{"\n"}
            • To offer tailored services and recommendations{"\n"}
            • To send order updates, promotional offers, and notifications
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            3. Subscription Plans
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            Monthly (2 times a day):{"\n"}
            • Premium: ₹3,499{"\n"}
            • Classic: ₹2,999{"\n\n"}
            Monthly (1 time a day):{"\n"}
            • Premium: ₹1,999{"\n"}
            • Classic: ₹999{"\n\n"}
            Weekly Plan: ₹999{"\n\n"}
            Your personal data is collected and used to manage these subscriptions effectively.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            4. How We Protect Your Information
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            • SSL encryption for data transmission{"\n"}
            • Restricted access to authorized personnel{"\n"}
            • Regular security audits{"\n\n"}
            However, no method of electronic storage is 100% secure.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            5. Sharing Your Information
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            We do not sell or rent your data. Information may be shared with:{"\n"}
            • Service providers (delivery, payment, support){"\n"}
            • Legal authorities when required
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            6. Cookies and Tracking Technologies
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            Cookies help analyze traffic, personalize content, and enhance user experience. You can modify cookie preferences in your browser settings.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            7. Your Rights
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            • Access, update, or delete your information{"\n"}
            • Opt-out of promotional emails{"\n"}
            • Request a copy of your data{"\n\n"}
            For concerns, email: info@tiffix.com
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            8. Third-Party Services
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            We use third-party payment and service providers. They are responsible for their own data practices.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            9. Changes to This Privacy Policy
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            Policy updates will be posted on this page. Continued use of our services indicates acceptance of changes.
          </Text>

          <Text className="font-semibold text-black dark:text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            10. Contact Us
          </Text>

          <Text className="text-base leading-6 text-gray-600 dark:text-gray-300 mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            Email: info@tiffix.com{"\n"}
            Phone: +91 9171009127
          </Text>

          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default PrivacyPolicy;
