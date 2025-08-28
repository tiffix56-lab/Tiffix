import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const Settings = () => {
  const { colorScheme } = useColorScheme();

  const settingsItems = [
    {
      id: 'change-password',
      title: 'Change Password',
      icon: 'lock',
      route: '/change-password',
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      icon: 'shield',
      route: '/privacy-policy',
    },
    {
      id: 'contact-us',
      title: 'Contact Us',
      icon: 'phone',
      route: '/contact-us',
    },
    {
      id: 'delete-account',
      title: 'Delete Account',
      icon: 'trash-2',
      route: '/delete-account',
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(`/(profile)${route}`);
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
              Setting
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Settings Menu */}
          <View className="space-y-1">
            {settingsItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleMenuPress(item.route)}
                className={`flex-row items-center justify-between  px-4 py-4`}>
                <View className="flex-row items-center">
                  <View
                    className={`mr-4 h-10 w-10 items-center justify-center rounded-full ${
                      colorScheme === 'dark' ? 'bg-neutral-700' : 'bg-gray-200'
                    }`}>
                    <Feather
                      name={item.icon as any}
                      size={20}
                      color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    />
                  </View>
                  <Text
                    className="text-base font-medium text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    {item.title}
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Settings;
