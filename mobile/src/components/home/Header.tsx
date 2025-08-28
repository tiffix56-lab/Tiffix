import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import ThemeToggle from '../ui/ThemeToggle';

const Header = () => {
  const { colorScheme } = useColorScheme();

  return (
    <View className="px-6 pb-6 pt-16">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <Feather
            name="map-pin"
            size={18}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          />
          <Text
            className="ml-2 text-sm font-medium text-black dark:text-white"
            style={{ fontFamily: 'Poppins_500Medium' }}>
            Khandari Crossing, Agra
          </Text>
        </View>

        <View className="flex-row items-center space-x-3">
          <TouchableOpacity className="p-2">
            <Feather name="bell" size={22} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <ThemeToggle />
        </View>
      </View>
    </View>
  );
};

export default Header;
