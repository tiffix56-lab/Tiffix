import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface ThemeToggleProps {
  style?: any;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ style }) => {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <TouchableOpacity
      onPress={toggleColorScheme}
      style={style}
      className="flex-row items-center rounded-full border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800">
      <Feather
        name={colorScheme === 'dark' ? 'moon' : 'sun'}
        size={16}
        color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
        style={{ marginRight: 6 }}
      />
      <Text className="text-sm font-medium text-black dark:text-white">
        {colorScheme === 'dark' ? 'Dark' : 'Light'}
      </Text>
    </TouchableOpacity>
  );
};

export default ThemeToggle;
