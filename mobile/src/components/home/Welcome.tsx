import React from 'react';
import { View, Text, Image } from 'react-native';

const Welcome = () => {
  return (
    <View className="px-6 pb-6">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            className="text-base text-zinc-600 dark:text-zinc-400"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            Hi! Mukul,
          </Text>
          <Text
            className="text-2xl font-bold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Breakfast Time!
          </Text>
        </View>
        <View className="relative">
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
            }}
            className="h-12 w-12 rounded-full"
          />
          <View className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-black" />
        </View>
      </View>
    </View>
  );
};

export default Welcome;
