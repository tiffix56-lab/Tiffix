import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { supportService } from '../../services/support.service';
import Toast from 'react-native-toast-message';

const ContactUs = () => {
  const { colorScheme } = useColorScheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitContact = async () => {
    if (!name || !email || !mobileNumber || !message) return;

    // Validate email format
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    // Validate mobile number is exactly 10 digits
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Mobile Number',
        text2: 'Mobile number must be exactly 10 digits',
      });
      return;
    }

    // Validate message minimum length
    if (message.trim().length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Message Too Short',
        text2: 'Message must be at least 10 characters long',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await supportService.submitContact({
        name,
        email,
        mobileNumber: mobileNumber,
        message,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Message Sent',
          text2: 'Your message has been sent successfully',
        });
        setName('');
        setEmail('');
        setMobileNumber('');
        setMessage('');
        router.back();
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
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    name &&
    email &&
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) &&
    mobileNumber.length === 10 &&
    message.trim().length >= 10;

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
              Contact us
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Address Section */}
          <View className="mb-8">
            <Text
              className="mb-4 text-lg font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Address
            </Text>
            <Text
              className="text-base leading-6 text-gray-600 dark:text-gray-300"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              House# 72, Road# 21, Banani, Dhaka-1213 (near Banani Bidyaniketon School & College,
              beside University of India)
            </Text>
          </View>

          {/* Contact Details */}
          <View className="mb-8">
            <Text
              className="mb-2 text-base font-medium text-gray-700 dark:text-gray-300"
              style={{ fontFamily: 'Poppins_500Medium' }}>
              Call : 7668009623 (24/7)
            </Text>
            <Text
              className="text-base font-medium text-gray-700 dark:text-gray-300"
              style={{ fontFamily: 'Poppins_500Medium' }}>
              Email : mukulparmar40@gmail.com
            </Text>
          </View>

          {/* Send Message Form */}
          <View className="mb-8">
            <Text
              className="mb-6 text-lg font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Send Message
            </Text>

            {/* Form Fields */}
            <View className="gap-6">
              {/* Name Field */}
              <View className="rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Name"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                  className="min-h-14 px-4 py-4 text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                />
              </View>

              {/* Email Field */}
              <View>
                <View
                  className={`rounded-md border px-4 ${
                    email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
                      ? 'border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950'
                      : 'border-zinc-100 bg-zinc-50 dark:border-zinc-400 dark:bg-black'
                  }`}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="min-h-14 px-4 py-4 text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                </View>
                {email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) && (
                  <Text
                    className="mt-1 text-xs text-red-600 dark:text-red-400"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Please enter a valid email address
                  </Text>
                )}
              </View>

              {/* Mobile Number Field */}
              <View className="min-h-14 flex-row items-center rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black">
                <View className="mr-3 flex-row items-center">
                  <Text className="mr-1 text-lg">🇮🇳</Text>
                  <Feather
                    name="chevron-down"
                    size={16}
                    color={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                  />
                </View>
                <Text
                  className="mr-2 text-base text-zinc-500 dark:text-zinc-400"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  +91
                </Text>
                <TextInput
                  value={mobileNumber}
                  onChangeText={(text) => {
                    // Only allow numbers and max 10 digits
                    const cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length <= 10) {
                      setMobileNumber(cleaned);
                    }
                  }}
                  placeholder="Your mobile number"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                  className="flex-1 text-base text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              {/* Message Field */}
              <View>
                <View className="rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black">
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Write your message (minimum 10 characters)"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="min-h-32 px-4 py-4 text-base text-black dark:text-white"
                    style={{
                      fontFamily: 'Poppins_400Regular',
                    }}
                    maxLength={1000}
                  />
                </View>
                <Text
                  className={`mt-1 text-xs ${
                    message.trim().length >= 10
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  {message.trim().length}/1000 characters (minimum 10)
                </Text>
              </View>
            </View>

            {/* Send Message Button */}
            <TouchableOpacity 
              onPress={handleSubmitContact}
              disabled={!isFormValid || isSubmitting}
              className={`mt-4 rounded-lg py-4 ${
                isFormValid && !isSubmitting 
                  ? 'bg-black dark:bg-white' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}>
              <Text
                className={`text-center text-base font-medium ${
                  isFormValid && !isSubmitting
                    ? 'text-white dark:text-black'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                style={{ fontFamily: 'Poppins_500Medium' }}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
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

export default ContactUs;
