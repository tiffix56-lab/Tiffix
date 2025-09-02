import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Controller, Control, FieldError } from 'react-hook-form';

interface FormInputProps {
  name: string;
  control: Control<any>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: FieldError;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  name,
  control,
  label,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  leftIcon,
  rightIcon,
  onRightIconPress,
  className = '',
}) => {
  const { colorScheme } = useColorScheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = secureTextEntry;
  const actualSecureEntry = isPassword ? !showPassword : false;

  const getInputContainerStyles = () => {
    const baseStyles = 'flex-row items-center rounded-md border px-4 bg-zinc-50 dark:bg-black';
    const focusStyles = isFocused 
      ? 'border-black dark:border-white' 
      : 'border-zinc-100 dark:border-zinc-400';
    const errorStyles = error 
      ? 'border-red-500 dark:border-red-400' 
      : '';
    const disabledStyles = disabled 
      ? 'opacity-50' 
      : '';

    return `${baseStyles} ${focusStyles} ${errorStyles} ${disabledStyles}`;
  };

  const iconColor = colorScheme === 'dark' ? '#71717A' : '#A1A1AA';

  return (
    <View className={className}>
      <Text className="mb-3 text-base font-medium text-black dark:text-white">
        {label}
      </Text>
      
      <View className={getInputContainerStyles()}>
        {leftIcon && (
          <View className="mr-3">
            <Feather name={leftIcon} size={20} color={iconColor} />
          </View>
        )}
        
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              className="flex-1 py-4 text-base text-black dark:text-white"
              placeholder={placeholder || label}
              placeholderTextColor={iconColor}
              value={value}
              onChangeText={onChange}
              onBlur={() => {
                onBlur();
                setIsFocused(false);
              }}
              onFocus={() => setIsFocused(true)}
              secureTextEntry={actualSecureEntry}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              editable={!disabled}
              multiline={multiline}
              numberOfLines={numberOfLines}
              maxLength={maxLength}
            />
          )}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-3"
          >
            <Feather
              name={showPassword ? 'eye' : 'eye-off'}
              size={20}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            className="ml-3"
          >
            <Feather name={rightIcon} size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="mt-2 text-sm text-red-500 dark:text-red-400">
          {error.message}
        </Text>
      )}
    </View>
  );
};