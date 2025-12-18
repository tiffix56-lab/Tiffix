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
import { referralService, ReferralStats } from '../../services/referral.service';
import Toast from 'react-native-toast-message';
import LottieView from 'lottie-react-native';

const Referral = () => {
  const { colorScheme } = useColorScheme();
  const [referralData, setReferralData] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const response = await referralService.getReferralStats();
      console.log(response.data?.referral.userReferralCode);
      
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
    if (!referralData?.referral.userReferralCode) return;
    
    Clipboard.setString(referralData.referral.userReferralCode);
    Toast.show({
      type: 'success',
      text1: 'Copied',
      text2: 'Referral code copied to clipboard',
    });
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
            <LottieView
              source={{ uri: "https://lottie.host/354ac5ac-267a-4085-a321-878c9242551b/Vpo1AbIdqP.json" }}
              autoPlay
              loop
              style={{ width: 300, height: 300, marginTop: 20 }}
            />
          </View>

          {/* Referral Information */}
          <View className="mb-8 items-center">
            <Text
              className="mb-4 text-center text-lg text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Refer a friend and Earn up to ₹100
            </Text>

            {/* Referral Code Input */}
            <View className="mb-4 w-full">
              <View className="flex-row items-center rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3 dark:border-zinc-600 dark:bg-black ">
                <TextInput
                  value={isLoading ? 'Loading...' : (referralData?.referral.userReferralCode || 'N/A')}
                  editable={false}
                  className="flex-1 text-base font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                />
                <TouchableOpacity onPress={copyToClipboard} className="ml-2" disabled={isLoading || !referralData?.referral.userReferralCode}>
                  <Feather
                    name="copy"
                    size={20}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {/* How It Works Section */}
<View className="mt-1">
  <Text
    className="text-xl font-semibold text-black dark:text-white mb-6"
    style={{ fontFamily: 'Poppins_600SemiBold' }}
  >
    Tiffix Refer & Earn — How It Works
  </Text>

  {/* Step 1 */}
  <View className="mb-8 rounded-2xl bg-zinc-50 dark:bg-neutral-900 p-4">
    <View className="flex-row items-center mb-4">
      <View className="bg-orange-500 rounded-full w-8 h-8 items-center justify-center mr-3">
        <Text className="text-white font-bold text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>1</Text>
      </View>
      <Text
        className="text-lg font-semibold text-black dark:text-white flex-1"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        Share Your Code
      </Text>
    </View>

    <View className="items-center mb-4">
      <Image
        source={require('@/assets/step1.png')}
        className="w-40 h-40"
        resizeMode="contain"
      />
    </View>

    <Text className="text-zinc-700 dark:text-zinc-300 leading-6 text-center">
      You (the Referrer) share your referral code with your friend.{"\n"}
      They purchase a new Tiffix subscription using your code.{"\n"}
      (Referral friend does not get a discount — the reward is yours!)
    </Text>
  </View>

  {/* Step 2 */}
  <View className="mb-8 rounded-2xl bg-zinc-50 dark:bg-neutral-900 p-4">
    <View className="flex-row items-center mb-4">
      <View className="bg-orange-500 rounded-full w-8 h-8 items-center justify-center mr-3">
        <Text className="text-white font-bold text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>2</Text>
      </View>
      <Text
        className="text-lg font-semibold text-black dark:text-white flex-1"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        Send Referral Proof
      </Text>
    </View>

    <View className="items-center mb-4">
      <Image
        source={require('@/assets/step2.png')}
        className="w-40 h-40"
        resizeMode="contain"
      />
    </View>

    <Text className="text-zinc-700 dark:text-zinc-300 leading-6 mb-3 text-center">
      After your friend subscribes, ask them for their Order ID and send the
      following details to Tiffix via WhatsApp or Email:
    </Text>

    <View className="bg-white dark:bg-black rounded-xl p-4">
      <Text className="text-zinc-700 dark:text-zinc-300 leading-6">• Full Name</Text>
      <Text className="text-zinc-700 dark:text-zinc-300 leading-6">• Registered Mobile Number</Text>
      <Text className="text-zinc-700 dark:text-zinc-300 leading-6">• Referral Friend's Order ID</Text>
      <Text className="text-zinc-700 dark:text-zinc-300 leading-6">• Bank Account Number</Text>
      <Text className="text-zinc-700 dark:text-zinc-300 leading-6">• IFSC Code</Text>
      <Text className="text-zinc-700 dark:text-zinc-300 leading-6">
        • (Optional) Screenshot of your friend's order confirmation
      </Text>
    </View>
  </View>

  {/* Step 3 */}
  <View className="mb-6 rounded-2xl bg-zinc-50 dark:bg-neutral-900 p-4">
    <View className="flex-row items-center mb-4">
      <View className="bg-orange-500 rounded-full w-8 h-8 items-center justify-center mr-3">
        <Text className="text-white font-bold text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>3</Text>
      </View>
      <Text
        className="text-lg font-semibold text-black dark:text-white flex-1"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        Get ₹200 in Your Bank
      </Text>
    </View>

    <View className="items-center mb-4">
      <Image
        source={require('@/assets/step3.png')}
        className="w-40 h-40"
        resizeMode="contain"
      />
    </View>

    <Text className="text-zinc-700 dark:text-zinc-300 leading-6 text-center">
      Once verified, Tiffix will credit ₹200 directly to your bank account{" "}
      within 2–5 working days.{"\n"}
      Clean. Quick. Direct to bank.
    </Text>
  </View>

  {/* Contact Link */}
  <View className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-4 mt-4">
    <Text className="text-zinc-800 dark:text-zinc-200 text-center mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
      Need help or want to submit your referral details?
    </Text>
    <TouchableOpacity
      onPress={() => router.push("https://tiffix.com/contact-us/")}
      className="bg-blue-600 rounded-xl py-3 px-6"
    >
      <Text className="text-white text-center font-semibold" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        Contact Us via WhatsApp/Email
      </Text>
    </TouchableOpacity>
  </View>
</View>

          

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Referral;
