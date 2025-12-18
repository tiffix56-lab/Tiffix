import React, { useEffect } from 'react';
import { View, TouchableOpacity, Image, Text, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';

interface SocialLoginButtonsProps {
  onLoading?: (loading: boolean) => void;
  className?: string;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onLoading,
  className = '',
}) => {
  const { googleLogin } = useAuth();

  useEffect(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    if (!webClientId) {
      console.error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured');
      return;
    }

    GoogleSignin.configure({
      webClientId,
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      onLoading?.(true);

      // Check for Play Services (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in and get user info
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo);

      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Authenticate with backend
      const result = await googleLogin(idToken);
      console.log(result, "Result");

      if (result.success) {
        if (result.needsProfileCompletion) {
          router.replace('/(profile)/edit-profile?requirePhone=true');
        } else {
          router.replace('/(tabs)/home');
        }
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error: any) {
      console.error('Google login error:', error);

      if (error.code === 'SIGN_IN_CANCELLED') {
        console.log('User cancelled Google Sign-In');
      } else if (error.code === 'IN_PROGRESS') {
        console.log('Google Sign-In already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        Alert.alert('Login Failed', 'Unable to sign in with Google. Please try again.');
      }
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
          onPress={handleGoogleLogin}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/google.png')}
            style={{ height: 32, width: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};