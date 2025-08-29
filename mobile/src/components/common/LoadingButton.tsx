import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { useColorScheme } from 'nativewind';

interface LoadingButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  className = '',
}) => {
  const { colorScheme } = useColorScheme();
  const isDisabled = disabled || loading;

  const getButtonStyles = () => {
    const baseStyles = 'flex-row items-center justify-center rounded-3xl';
    
    const sizeStyles = {
      small: 'py-2 px-4',
      medium: 'py-4 px-6',
      large: 'py-5 px-8',
    };

    const variantStyles = {
      primary: isDisabled 
        ? 'bg-zinc-300 dark:bg-zinc-600' 
        : 'bg-black dark:bg-white',
      secondary: isDisabled
        ? 'bg-zinc-100 dark:bg-zinc-800'
        : 'bg-zinc-200 dark:bg-zinc-700',
      outline: isDisabled
        ? 'border border-zinc-300 dark:border-zinc-600 bg-transparent'
        : 'border border-black dark:border-white bg-transparent',
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;
  };

  const getTextStyles = () => {
    const baseStyles = 'text-center font-medium';
    
    const sizeStyles = {
      small: 'text-sm',
      medium: 'text-lg',
      large: 'text-xl',
    };

    const variantStyles = {
      primary: isDisabled
        ? 'text-zinc-500 dark:text-zinc-400'
        : 'text-white dark:text-black',
      secondary: isDisabled
        ? 'text-zinc-400 dark:text-zinc-500'
        : 'text-black dark:text-white',
      outline: isDisabled
        ? 'text-zinc-400 dark:text-zinc-500'
        : 'text-black dark:text-white',
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  const getSpinnerColor = () => {
    if (variant === 'primary') {
      return colorScheme === 'dark' ? '#000000' : '#FFFFFF';
    }
    return colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  };

  return (
    <TouchableOpacity
      className={getButtonStyles()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading && (
        <View className="mr-2">
          <ActivityIndicator size="small" color={getSpinnerColor()} />
        </View>
      )}
      <Text className={getTextStyles()}>{title}</Text>
    </TouchableOpacity>
  );
};