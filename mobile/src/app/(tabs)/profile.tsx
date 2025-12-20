import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import { userService } from '@/services/user.service';
import { uploadService } from '@/services/upload.service';
import { User } from '@/types/user.types';
import { useAuth } from '@/context/AuthContext';

const Profile = () => {
  const { colorScheme } = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const { logout } = useAuth();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log('🔄 [PROFILE_TAB] Fetching user profile data (including avatar)...');
      
      // Get both auth user and user profile to have complete data
      const [authResponse, profileResponse] = await Promise.all([
        userService.getCurrentUser(),
        userService.getUserProfile()
      ]);
      
      console.log('👤 [PROFILE_TAB] Auth response:', authResponse);
      console.log('📋 [PROFILE_TAB] Profile response:', profileResponse);
      
      if (authResponse.success && authResponse.data) {
        const authUser = authResponse.data.user;
        let userData = authUser;
        
        // Merge profile data if available (includes avatar)
        if (profileResponse.success && profileResponse.data?.userProfile?.userId) {
          const profile = profileResponse.data.userProfile.userId;
          userData = {
            ...authUser,
            ...profile, // This should include avatar, phoneNumber, gender, etc.
          };
          console.log('✅ [PROFILE_TAB] Merged user data with profile:', userData);
        }
        
        setUser(userData);
      }
    } catch (err) {
      console.error('[PROFILE_TAB] Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

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
      route: '(tabs)/subscription',
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
    if (route === '/logout') {
      // Show confirmation dialog for logout
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/');
            },
          },
        ]
      );
    } else {
      if(route.startsWith('(tabs)')) {
        router.push(`/${route}`);
      } else {
        router.push(`/(profile)${route}`);

      }
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Limited functionality', 'Image picker is limited in web browser');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploadingPhoto(true);
      const selectedImage = result.assets[0];

      try {
        const imageUrl = await uploadService.uploadImageAsset(selectedImage);
        
        // Update user profile with new image URL
        const updateResponse = await userService.updateUserProfile({
          avatar: imageUrl
        });

        if (updateResponse.success) {
          setUser(prev => prev ? { ...prev, avatar: imageUrl } : null);
          
          Alert.alert('Success', 'Profile picture updated successfully');
        } else {
          throw new Error(updateResponse.message || 'Failed to update profile');
        }
      } catch (error) {
        console.error('Image upload error:', error);
        Alert.alert('Upload Failed', error.message || 'Could not upload the image');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos.');
      return;
    }

    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => pickImage() },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploadingPhoto(true);
      const selectedImage = result.assets[0];

      try {
        const imageUrl = await uploadService.uploadImageAsset(selectedImage);
        
        // Update user profile with new image URL
        const updateResponse = await userService.updateUserProfile({
          avatar: imageUrl
        });

        if (updateResponse.success) {
          setUser(prev => prev ? { ...prev, avatar: imageUrl } : null);
          
          Alert.alert('Success', 'Profile picture updated successfully');
        } else {
          throw new Error(updateResponse.message || 'Failed to update profile');
        }
      } catch (error) {
        console.error('Camera upload error:', error);
        Alert.alert('Upload Failed', error.message || 'Could not upload the image');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    } finally {
      setUploadingPhoto(false);
    }
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
                  uri: user?.avatar || user?.profilePicture || 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?q=80&w=1170&auto=format&fit=crop',
                }}
                className="h-24 w-24 rounded-full"
                resizeMode="cover"
              />
              <TouchableOpacity 
                className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800"
                onPress={handlePhotoPress}
                disabled={uploadingPhoto}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
                ) : (
                  <Feather
                    name="camera"
                    size={16}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  />
                )}
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            ) : (
              <Text
                className="text-xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {user?.name || user?.fullName || 'User'}
              </Text>
            )}
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
