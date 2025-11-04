import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { supportService } from '../../services/support.service';
import { userService } from '../../services/user.service';
import Toast from 'react-native-toast-message';

const Complain = () => {
  const { colorScheme } = useColorScheme();
  const [selectedComplaintType, setSelectedComplaintType] = useState('Not Professional');
  const [complaintText, setComplaintText] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [showComplaintTypeDropdown, setShowComplaintTypeDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching user profile data for complaint form...');

      // Get both auth user and user profile to have complete data
      const [authResponse, profileResponse] = await Promise.all([
        userService.getCurrentUser(),
        userService.getUserProfile()
      ]);

      console.log('👤 Auth response:', authResponse);
      console.log('📋 Profile response:', profileResponse);

      if (authResponse.success && authResponse.data) {
        const authUser = authResponse.data.user;
        let userData = authUser;

        console.log('📞 Auth user phone number:', authUser.phoneNumber);

        // Merge profile data if available (includes avatar)
        if (profileResponse.success && profileResponse.data?.userProfile?.userId) {
          const profile = profileResponse.data.userProfile.userId;
          console.log('📞 Profile user phone number:', profile.phoneNumber);
          userData = {
            ...authUser,
            ...profile, // This should include avatar, phoneNumber, gender, etc.
          };
          console.log('✅ Merged user data with profile:', userData);
        }

        const name = userData.name || userData.fullName || '';
        setUserName(name);
        console.log('👤 User name:', name);

        // Try multiple possible phone number fields
        const phoneData = userData.phoneNumber || authUser.phoneNumber;
        console.log('📞 Final phone number to use:', phoneData);

        // Handle phone number - it might be an object or a string
        let phone = '';
        if (phoneData) {
          if (typeof phoneData === 'string') {
            phone = phoneData;
          } else if (typeof phoneData === 'object' && phoneData.internationalNumber) {
            // Extract just the number part from "+91 83086 57425"
            phone = phoneData.internationalNumber.replace(/^\+91\s*/, '').replace(/\s/g, '');
          }
        }
        console.log('📞 Extracted phone number:', phone);
        setUserPhone(phone);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async () => {
    // Validate complaint text
    if (complaintText.length < 10) {
      Alert.alert('Validation Error', 'Complaint description must be at least 10 characters');
      return;
    }

    // Validate user data is loaded
    if (!userName || !userPhone) {
      Alert.alert('Error', 'Unable to load your profile information. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting complaint with data:', {
        title: selectedComplaintType,
        reason: complaintText.trim(),
        name: userName,
        phoneNumber: userPhone,
      });

      const result = await supportService.submitComplaint({
        title: selectedComplaintType,
        reason: complaintText.trim(),
        name: userName,
        phoneNumber: userPhone,
      });

      if (result.success) {
        Alert.alert(
          'Success',
          'Your complaint has been submitted successfully',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Submission Failed', result.message || 'Failed to submit complaint');
      }
    } catch (error) {
      Alert.alert('Submission Failed', 'Something went wrong. Please try again.');
      console.error('Error submitting complaint:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const complaintTypes = [
    'Not Professional',
    'Food Quality Issue',
    'Delivery Problem',
    'Payment Issue',
    'App Technical Issue',
    'Other',
  ];

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
              Complain
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            <Text className="mt-4 text-base text-zinc-500 dark:text-zinc-400">Loading...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
            {/* Complaint Type Dropdown */}
            <View className="mb-6">
              <Text
                className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                Complaint Type
              </Text>
            <TouchableOpacity
              className="min-h-14 flex-row items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black"
              onPress={() => setShowComplaintTypeDropdown(!showComplaintTypeDropdown)}>
              <Text
                className="text-base text-black dark:text-white"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                {selectedComplaintType}
              </Text>
              <Feather
                name={showComplaintTypeDropdown ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
              />
            </TouchableOpacity>

            {/* Dropdown Options */}
            {showComplaintTypeDropdown && (
              <View className="mt-1 rounded-md border border-zinc-100 bg-white dark:border-zinc-400 dark:bg-neutral-800">
                {complaintTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    className="border-b border-zinc-50 px-4 py-3 last:border-b-0 dark:border-zinc-700"
                    onPress={() => {
                      setSelectedComplaintType(type);
                      setShowComplaintTypeDropdown(false);
                    }}>
                    <Text
                      className={`text-base ${
                        selectedComplaintType === type
                          ? 'font-medium text-lime-600 dark:text-lime-400'
                          : 'text-black dark:text-white'
                      }`}
                      style={{ fontFamily: 'Poppins_400Regular' }}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Complaint Details */}
          <View className="mb-8">
            <Text
              className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              style={{ fontFamily: 'Poppins_500Medium' }}>
              Complaint Description
            </Text>
            <View className="rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black">
              <TextInput
                value={complaintText}
                onChangeText={setComplaintText}
                placeholder="Write your complain here (minimum 10 characters)"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="min-h-32 px-4 py-4 text-base text-black dark:text-white"
                style={{
                  fontFamily: 'Poppins_400Regular',
                }}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitComplaint}
            className={`rounded-lg py-4 ${
              complaintText.length >= 10 && !isSubmitting
                ? 'bg-black dark:bg-white'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            disabled={complaintText.length < 10 || isSubmitting}>
            {isSubmitting ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'} />
                <Text
                  className="ml-2 text-center text-base font-medium text-white dark:text-black"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  Submitting...
                </Text>
              </View>
            ) : (
              <Text
                className={`text-center text-base font-medium ${
                  complaintText.length >= 10
                    ? 'text-white dark:text-black'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                style={{ fontFamily: 'Poppins_500Medium' }}>
                Submit Complaint
              </Text>
            )}
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
        )}
      </View>
    </View>
  );
};

export default Complain;
