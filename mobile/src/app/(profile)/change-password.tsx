import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const ChangePassword = () => {
  const { colorScheme } = useColorScheme();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
              Change Password
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Password Fields */}
          <View className="gap-6">
            {/* Old Password */}
            <View className="min-h-14 flex-row items-center rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black">
              <TextInput
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Old password"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                secureTextEntry={!showOldPassword}
                className="flex-1 text-base text-black dark:text-white"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                <Feather
                  name={showOldPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View className="min-h-14 flex-row items-center rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                secureTextEntry={!showNewPassword}
                className="flex-1 text-base text-black dark:text-white"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Feather
                  name={showNewPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View className="min-h-14 flex-row items-center rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                secureTextEntry={!showConfirmPassword}
                className="flex-1 text-base text-black dark:text-white"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Feather
                  name={showConfirmPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity className="mt-8 rounded-lg bg-black py-4 dark:bg-white">
            <Text
              className="text-center text-base font-medium text-white dark:text-black"
              style={{ fontFamily: 'Poppins_500Medium' }}>
              Save
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default ChangePassword;
