import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Switch } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { settingsService, UserSettings } from '../../services/settings.service';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

const Settings = () => {
  const { colorScheme } = useColorScheme();
  const { logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsService.getUserSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (path: string, value: any) => {
    if (!settings) return;

    const updatedSettings = { ...settings };
    const keys = path.split('.');
    let current = updatedSettings as any;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    setSettings(updatedSettings);

    try {
      await settingsService.updateUserSettings(updatedSettings);
      Toast.show({
        type: 'success',
        text1: 'Settings Updated',
        text2: 'Your settings have been saved',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to save settings',
      });
      loadSettings();
    }
  };

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
    // {
    //   id: 'delete-account',
    //   title: 'Delete Account',
    //   icon: 'trash-2',
    //   route: '/delete-account',
    // },
  ];

  const handleMenuPress = (route: string) => {
    router.push(`/(profile)${route}`);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
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
          {/* Notification Settings */}
          {settings && (
            <View className="mb-8">
              <Text
                className="mb-4 text-lg font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Notifications
              </Text>
              
              <View className="space-y-4">
                <View className="flex-row items-center justify-between py-2">
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Push Notifications
                  </Text>
                  <Switch
                    value={settings.notifications.pushNotifications}
                    onValueChange={(value) => updateSetting('notifications.pushNotifications', value)}
                  />
                </View>
                
                <View className="flex-row items-center justify-between py-2">
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Email Notifications
                  </Text>
                  <Switch
                    value={settings.notifications.emailNotifications}
                    onValueChange={(value) => updateSetting('notifications.emailNotifications', value)}
                  />
                </View>
                
                <View className="flex-row items-center justify-between py-2">
                  <Text
                    className="text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_400Regular' }}>
                    Order Updates
                  </Text>
                  <Switch
                    value={settings.notifications.orderUpdates}
                    onValueChange={(value) => updateSetting('notifications.orderUpdates', value)}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Settings Menu */}
          <View className="mb-8">
            <Text
              className="mb-4 text-lg font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Account
            </Text>
            
            <View className="space-y-1">
              {settingsItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleMenuPress(item.route)}
                  className={`flex-row items-center justify-between px-4 py-4`}>
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
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            onPress={handleLogout}
            className="mb-8 rounded-lg bg-red-500 py-4">
            <Text
              className="text-center text-base font-medium text-white"
              style={{ fontFamily: 'Poppins_500Medium' }}>
              Logout
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Settings;
