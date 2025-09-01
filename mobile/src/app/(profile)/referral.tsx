import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
  Clipboard,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { referralService, ReferralData } from '../../services/referral.service';
import Toast from 'react-native-toast-message';

const Referral = () => {
  const { colorScheme } = useColorScheme();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const response = await referralService.getReferralData();
      if (response.success && response.data) {
        setReferralData(response.data);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!referralData?.referralCode) return;
    
    Clipboard.setString(referralData.referralCode);
    Toast.show({
      type: 'success',
      text1: 'Copied',
      text2: 'Referral code copied to clipboard',
    });
  };

  const handleSendInvite = async () => {
    if (!email) return;

    setIsSendingInvite(true);
    try {
      const result = await referralService.sendInvite(email);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Invite Sent',
          text2: 'Invitation sent successfully',
        });
        setEmail('');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Send Failed',
          text2: result.message,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Send Failed',
        text2: 'Something went wrong',
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* More top margin */}
      <View className="h-12" />

      {/* Header with more height and rounded back button */}
      <View className="bg-zinc-50 px-6 pb-8 pt-8 dark:bg-neutral-900">
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
              Referral
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Central Illustration */}
          <View className="mb-8 items-center">
            <Image
              source={require('@/assets/referal-img.png')}
              className="h-80 w-80"
              resizeMode="contain"
            />
          </View>

          {/* Referral Information */}
          <View className="mb-8 items-center">
            <Text
              className="mb-4 text-center text-lg text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Refer a friend and Earn upto $100
            </Text>

            {/* Referral Code Input */}
            <View className="mb-4 w-full">
              <View className="flex-row items-center rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3 dark:border-zinc-600 dark:bg-black ">
                <TextInput
                  value={isLoading ? 'Loading...' : (referralData?.referralCode || 'N/A')}
                  editable={false}
                  className="flex-1 text-base font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                />
                <TouchableOpacity onPress={copyToClipboard} className="ml-2" disabled={isLoading || !referralData?.referralCode}>
                  <Feather
                    name="copy"
                    size={20}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Email Input for Invite */}
            <View className="mb-4 w-full">
              <View className="rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3 dark:border-zinc-600 dark:bg-black">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter friend's email"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                  keyboardType="email-address"
                  className="text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                />
              </View>
            </View>

            <Text
              className="text-center text-sm text-zinc-600 dark:text-zinc-400"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              Invite your friends to join TIFFIX and get upto 10% on each friend order
            </Text>
          </View>

          {/* Invite Now Button */}
          <View className="mb-8">
            <TouchableOpacity 
              onPress={handleSendInvite}
              disabled={!email || isSendingInvite}
              className={`rounded-lg py-4 ${
                email && !isSendingInvite 
                  ? 'bg-black dark:bg-white' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}>
              <Text
                className={`text-center text-base font-bold ${
                  email && !isSendingInvite
                    ? 'text-white dark:text-black'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {isSendingInvite ? 'SENDING...' : 'INVITE NOW'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Referral;
