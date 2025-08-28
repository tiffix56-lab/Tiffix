import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const Complain = () => {
  const { colorScheme } = useColorScheme();
  const [selectedComplaintType, setSelectedComplaintType] = useState('Therapist not Professional');
  const [complaintText, setComplaintText] = useState('');
  const [showComplaintTypeDropdown, setShowComplaintTypeDropdown] = useState(false);

  const complaintTypes = [
    'Therapist not Professional',
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
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Complaint Type Dropdown */}
          <View className="mb-6">
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
            className={`rounded-lg py-4 ${
              complaintText.length >= 10 ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            disabled={complaintText.length < 10}>
            <Text
              className={`text-center text-base font-medium ${
                complaintText.length >= 10
                  ? 'text-white dark:text-black'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              style={{ fontFamily: 'Poppins_500Medium' }}>
              Submit
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Complain;
