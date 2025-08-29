import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface ErrorMessageProps {
  message?: string;
  visible?: boolean;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  visible = true,
  variant = 'error',
  className = '',
}) => {
  const { colorScheme } = useColorScheme();

  if (!message || !visible) {
    return null;
  }

  const getIconName = () => {
    switch (variant) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      case 'info':
        return 'info';
      default:
        return 'alert-circle';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'error':
        return colorScheme === 'dark' ? '#F87171' : '#EF4444';
      case 'warning':
        return colorScheme === 'dark' ? '#FBBF24' : '#F59E0B';
      case 'info':
        return colorScheme === 'dark' ? '#60A5FA' : '#3B82F6';
      default:
        return colorScheme === 'dark' ? '#F87171' : '#EF4444';
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'error':
        return 'text-red-500 dark:text-red-400';
      case 'warning':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'info':
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-red-500 dark:text-red-400';
    }
  };

  const getBackgroundStyle = () => {
    switch (variant) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    }
  };

  return (
    <View className={`flex-row items-center rounded-lg border p-3 ${getBackgroundStyle()} ${className}`}>
      <Feather
        name={getIconName()}
        size={16}
        color={getIconColor()}
        style={{ marginRight: 8 }}
      />
      <Text className={`flex-1 text-sm font-medium ${getTextStyle()}`}>
        {message}
      </Text>
    </View>
  );
};