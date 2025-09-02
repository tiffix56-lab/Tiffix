import React from 'react';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { useColorScheme } from 'nativewind';
import { authService } from '../../services/auth.service';
import * as Linking from 'expo-linking';

interface SocialLoginButtonsProps {
  onLoading?: (loading: boolean) => void;
  className?: string;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onLoading,
  className = '',
}) => {
  const { colorScheme } = useColorScheme();

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      onLoading?.(true);
      const url = await authService.getSocialLoginUrl(provider);
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
    } finally {
      onLoading?.(false);
    }
  };

  return (
    <View className={`items-center ${className}`}>
      <Text className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Or Login With...
      </Text>
      
      <View className="flex-row justify-center gap-6">
        <TouchableOpacity
          className="h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800"
          onPress={() => handleSocialLogin('facebook')}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/facebook.png')}
            style={{ height: 32, width: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800"
          onPress={() => handleSocialLogin('google')}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/google.png')}
            style={{ height: 32, width: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800"
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/apple.png')}
            style={{ height: 32, width: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};