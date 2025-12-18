import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAuth } from '../../context/AuthContext';

const DeleteAccount = () => {
  const { colorScheme } = useColorScheme();
  const { deleteAccount, isLoading } = useAuth();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAccount();
            if (result.success) {
              router.replace('/');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="bg-zinc-50 px-6 pb-6 pt-24 dark:bg-neutral-900">
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
              Delete Account
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Warning Message */}
          <View className="mb-8">
            <Text
              className="mb-4 text-base leading-6 text-gray-600 dark:text-gray-300"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              Are you sure you want to delete your account? Please read how account deletion will
              affect.
            </Text>
            <Text
              className="text-base leading-6 text-gray-600 dark:text-gray-300"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              Deleting your account removes personal information our database. Your email becomes
              permanently reserved and same email cannot be re-use to register a new account.
            </Text>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={isLoading}
            className={`rounded-lg py-4 ${
              isLoading ? 'bg-red-300' : 'bg-red-500'
            }`}>
            <Text
              className="text-center text-base font-medium text-white"
              style={{ fontFamily: 'Poppins_500Medium' }}>
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default DeleteAccount;
