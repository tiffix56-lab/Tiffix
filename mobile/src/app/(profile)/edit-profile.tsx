import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import { userService } from '@/services/user.service';
import { uploadService } from '@/services/upload.service';
import { User } from '@/types/user.types';

const EditProfile = () => {
  const { colorScheme } = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await userService.getCurrentUser();
      
      if (response.success && response.data) {
        const userData = response.data.user;
        setUser(userData);
        setName(userData.name || userData.fullName || '');
        setMobileNumber(userData.phoneNumber || '');
        setGender(userData.gender || 'male');
      } else {
        setError('Failed to load user data');
      }
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        name: name.trim(),
        phoneNumber: mobileNumber.trim() || undefined,
        gender: gender,
      };

      const response = await userService.updateUserProfile(updateData);
      
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully');
        router.back();
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadProfileImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const uploadProfileImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);
      
      console.log('📱 Starting profile image upload from edit-profile...', {
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize
      });
      
      const formData = new FormData();
      
      // Create proper file object for React Native
      const fileData = {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg', 
        name: asset.fileName || `profile_edit_${Date.now()}.jpg`,
      };
      
      console.log('📦 File data for upload:', fileData);
      
      formData.append('file', fileData as any);
      formData.append('category', 'profile');

      console.log('🚀 Uploading profile image...');
      const response = await uploadService.uploadProfilePhoto(formData);
      
      console.log('📤 Profile image upload response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Image upload successful, updating user profile...');
        
        // Update user profile with new image URL
        const updateResponse = await userService.updateUserProfile({
          name: name.trim(),
          phoneNumber: mobileNumber.trim() || undefined,
          gender: gender,
          avatar: response.data.url,
        });
        
        console.log('👤 User profile update response:', updateResponse);
        
        if (updateResponse.success) {
          Alert.alert('Success', 'Profile picture updated successfully');
          fetchUserData(); // Refresh user data
        } else {
          console.error('❌ Profile update failed:', updateResponse.message);
          Alert.alert('Error', updateResponse.message || 'Failed to update profile picture');
        }
      } else {
        console.error('❌ Image upload failed:', response.message);
        Alert.alert('Error', response.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('❌ Profile image upload error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
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
          {/* Profile Picture */}
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
                onPress={handleImagePick}
                disabled={uploading}
                className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
                {uploading ? (
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
            <Text
              className="text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {user?.name || user?.fullName || 'User'}
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            <Text className="mt-4 text-base text-zinc-500 dark:text-zinc-400">Loading profile...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Feather name="alert-circle" size={48} color={colorScheme === 'dark' ? '#EF4444' : '#DC2626'} />
            <Text className="mt-4 text-center text-lg font-medium text-zinc-600 dark:text-zinc-300">
              {error}
            </Text>
            <TouchableOpacity 
              onPress={fetchUserData}
              className="mt-4 rounded-xl bg-black px-6 py-3 dark:bg-white"
            >
              <Text className="text-white font-medium dark:text-black">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            <ScrollView className="flex-1 px-6 pt-12" showsVerticalScrollIndicator={false}>
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
                    onChangeText={setMobileNumber}
                    placeholder="Your mobile number"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                    className="flex-1 text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Gender Field */}
                <View>
                  <Text
                    className="mb-3 text-sm font-medium text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Gender
                  </Text>
                  <View className="flex-row space-x-4">
                    {['male', 'female', 'other'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => setGender(option as 'male' | 'female' | 'other')}
                        className={`flex-1 rounded-lg border py-3 ${
                          gender === option
                            ? 'border-black bg-black dark:border-white dark:bg-white'
                            : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900'
                        }`}>
                        <Text
                          className={`text-center text-sm font-medium ${
                            gender === option
                              ? 'text-white dark:text-black'
                              : 'text-black dark:text-white'
                          }`}
                          style={{ fontFamily: 'Poppins_500Medium' }}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Bottom Spacing */}
              <View className="h-24" />
            </ScrollView>

            {/* Update Button - Fixed at bottom */}
            <View className="px-6 pb-6 pt-4 bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-800">
              <TouchableOpacity 
                onPress={handleUpdate}
                disabled={saving}
                className={`rounded-lg py-4 ${
                  saving 
                    ? 'bg-zinc-400 dark:bg-zinc-600' 
                    : 'bg-black dark:bg-white'
                }`}>
                {saving ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text
                      className="ml-2 text-center text-base font-medium text-white"
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      Updating...
                    </Text>
                  </View>
                ) : (
                  <Text
                    className="text-center text-base font-medium text-white dark:text-black"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Update Profile
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default EditProfile;
