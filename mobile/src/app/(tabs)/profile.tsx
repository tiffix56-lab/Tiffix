import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const Profile = () => {
  const { colorScheme } = useColorScheme();

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: 'user',
      route: '/edit-profile',
    },
    {
      id: 'my-subscription',
      title: 'My Subscription',
      icon: 'file-text',
      route: '/my-subscription',
    },
    {
      id: 'address',
      title: 'Address',
      icon: 'map-pin',
      route: '/address',
    },
    {
      id: 'payment-history',
      title: 'Payment History',
      icon: 'credit-card',
      route: '/payment-history',
    },
    {
      id: 'complain',
      title: 'Complain',
      icon: 'alert-circle',
      route: '/complain',
    },
    {
      id: 'referral',
      title: 'Referral',
      icon: 'users',
      route: '/referral',
    },
    {
      id: 'about-us',
      title: 'About Us',
      icon: 'info',
      route: '/about-us',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      route: '/settings',
    },
    {
      id: 'help-support',
      title: 'Help and Support',
      icon: 'help-circle',
      route: '/help-support',
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: 'calendar',
      route: '/calendar',
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out',
      route: '/logout',
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(`/(profile)${route}`);
  };

  return (
    <View className="flex-1 bg-zinc-50 pb-12 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="bg-zinc-50 px-6 pb-6 pt-24 dark:bg-neutral-900">
        <View className="flex-row items-start">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
            <Feather
              name="arrow-left"
              size={20}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
          {/* Profile Section */}
          <View className="mx-auto mb-8 items-center">
            <View className="relative mb-4">
              <Image
                source={{
                  uri: 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?q=80&w=1170&auto=format&fit=crop',
                }}
                className="h-24 w-24 rounded-full"
                resizeMode="cover"
              />
              <TouchableOpacity className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
                <Feather
                  name="camera"
                  size={16}
                  color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                />
              </TouchableOpacity>
            </View>
            <Text
              className="text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Mukul Parmar
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Menu Items */}
          <View className="space-y-1">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleMenuPress(item.route)}
                className={`flex-row items-center justify-between rounded-md  px-4 py-4 ${
                  colorScheme === 'dark' ? 'bg-black' : 'bg-white'
                }`}>
                <View className="flex-row items-center">
                  <View
                    className={`mr-4 h-10 w-10 items-center justify-center rounded-full ${
                      colorScheme === 'dark' ? 'bg-black' : 'bg-gray-200'
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

export default Profile;
