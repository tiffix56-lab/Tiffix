import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const AboutUs = () => {
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
              About Us
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          <Text
            className="mb-6 text-2xl font-semibold text-gray-800 dark:text-gray-100"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Welcome to Tiffix
          </Text>

          <Text
            className="mb-4 text-base leading-6 text-gray-600 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            At Tiffix, we're passionate about bringing the authentic taste of home-cooked meals
            right to your doorstep. Our journey began with a simple mission: to connect busy
            professionals and students with the comforting flavors of traditional tiffin meals,
            prepared with love and care.
          </Text>

          <Text
            className="mb-4 text-base leading-6 text-gray-600 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            We understand that in today's fast-paced world, finding time to prepare nutritious,
            home-style meals can be challenging. That's why we've created a network of passionate
            home chefs and professional kitchens who prepare fresh, wholesome meals daily, ensuring
            you never have to compromise on quality or taste.
          </Text>

          <Text
            className="mb-4 text-base leading-6 text-gray-600 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            Our commitment to excellence extends beyond just food. We prioritize hygiene,
            punctuality, and customer satisfaction. Each meal is prepared following strict quality
            standards, packed with care, and delivered on time to ensure you get the best dining
            experience possible.
          </Text>

          <Text
            className="mb-4 text-base leading-6 text-gray-600 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            What sets us apart is our dedication to preserving the authenticity of traditional
            recipes while adapting to modern dietary preferences. Whether you're craving classic
            comfort food or looking for healthy alternatives, we've got you covered.
          </Text>

          <Text
            className="mb-4 text-base leading-6 text-gray-600 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            Join thousands of satisfied customers who have made Tiffix their trusted partner for
            daily meals. Experience the convenience of doorstep delivery combined with the warmth of
            home-cooked food.
          </Text>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default AboutUs;
