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
      console.log('🔄 Fetching user profile data (including avatar)...');
      
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

        setUser(userData);
        setName(userData.name || userData.fullName || '');

        // Try multiple possible phone number fields
        const phoneData = userData.phoneNumber || userData.phone || authUser.phoneNumber;
        console.log('📞 Final phone number to display:', phoneData);

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
        setMobileNumber(phone);

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

      // Validate file size (max 5MB)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select an image smaller than 5MB.');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (asset.mimeType && !allowedTypes.includes(asset.mimeType)) {
        Alert.alert('Invalid File Type', 'Please select a JPEG, PNG, or WebP image.');
        return;
      }

      console.log('🚀 Uploading profile image using working method from profile page...');
      
      // Use the same method that works in the profile page
      const imageUrl = await uploadService.uploadImageAsset(asset);
      console.log('✅ Image upload successful, got URL:', imageUrl);
      
      // Update user profile with new image URL
      const updateResponse = await userService.updateUserProfile({
        name: name.trim(),
        phoneNumber: mobileNumber.trim() || undefined,
        gender: gender,
        avatar: imageUrl,
      });
      
      console.log('👤 User profile update response:', updateResponse);
      
      if (updateResponse.success) {
        console.log('🖼️ Updating user state with new avatar URL:', imageUrl);
        
        // Update the user state immediately with the new image URL
        setUser(prev => {
          const updatedUser = prev ? { ...prev, avatar: imageUrl } : null;
          console.log('👤 Updated user state:', updatedUser);
          return updatedUser;
        });
        
        // Also refresh user data to make sure everything is in sync
        console.log('🔄 Refreshing user data from server...');
        await fetchUserData();
        
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        console.error('❌ Profile update failed:', updateResponse.message);
        Alert.alert('Profile Update Failed', updateResponse.message || 'Image uploaded but failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('❌ Profile image upload error:', error);
      
      let errorMessage = 'Failed to upload image. ';
      let title = 'Upload Error';
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('network') || error.message.includes('timeout') || error.message.includes('internet connection')) {
          title = 'Network Error';
          errorMessage = 'Please check your internet connection and try again. Make sure you have a stable connection.';
        } else if (error.message.includes('size') || error.message.includes('large')) {
          title = 'File Too Large';
          errorMessage = 'The image is too large. Please select a smaller image (under 5MB).';
        } else if (error.message.includes('format') || error.message.includes('type')) {
          title = 'Invalid File Type';
          errorMessage = 'Please select a valid image file (JPEG, PNG, or WebP).';
        } else if (error.message.includes('server') || error.message.includes('500')) {
          title = 'Server Error';
          errorMessage = 'Server is temporarily unavailable. Please try again in a few moments.';
        } else {
          errorMessage = 'An unexpected error occurred. Please try again.';
        }
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      Alert.alert(title, errorMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: handleImagePick }
      ]);
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
                key={user?.avatar || 'default'} // Force re-render when avatar changes
                source={{
                  uri: user?.avatar || user?.profilePicture || 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?q=80&w=1170&auto=format&fit=crop',
                }}
                className="h-28 w-28 rounded-full border-4 border-white dark:border-zinc-800"
                resizeMode="cover"
              />
              <TouchableOpacity 
                onPress={handleImagePick}
                disabled={uploading}
                className="absolute bottom-1 right-1 h-10 w-10 items-center justify-center rounded-full bg-black shadow-lg dark:bg-white"
                activeOpacity={0.7}>
                {uploading ? (
                  <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'} />
                ) : (
                  <Feather
                    name="camera"
                    size={18}
                    color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'}
                  />
                )}
              </TouchableOpacity>
            </View>
            <Text
              className="text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {user?.name || user?.fullName || 'User'}
            </Text>
            <TouchableOpacity 
              onPress={handleImagePick}
              disabled={uploading}
              className="mt-2 rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-800"
              activeOpacity={0.7}>
              <Text
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                {uploading ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
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
                    placeholder="Mobile number"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                    className="flex-1 py-3 text-base text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>

                {/* Gender Field */}
                <View>
                  <Text
                    className="mb-4 text-sm font-medium text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Gender
                  </Text>
                  <View className="flex-row gap-3">
                    {[
                      { value: 'male', label: 'Male', icon: 'user' },
                      { value: 'female', label: 'Female', icon: 'user' },
                      { value: 'other', label: 'Other', icon: 'user' }
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setGender(option.value as 'male' | 'female' | 'other')}
                        className={`flex-1 rounded-xl border-2 py-4 px-3 ${
                          gender === option.value
                            ? 'border-black bg-black dark:border-white dark:bg-white'
                            : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900'
                        }`}
                        activeOpacity={0.7}>
                        <View className="items-center">
                          <Feather 
                            name={option.icon as any} 
                            size={20} 
                            color={
                              gender === option.value
                                ? (colorScheme === 'dark' ? '#000000' : '#FFFFFF')
                                : (colorScheme === 'dark' ? '#FFFFFF' : '#000000')
                            } 
                          />
                          <Text
                            className={`mt-2 text-center text-sm font-medium ${
                              gender === option.value
                                ? 'text-white dark:text-black'
                                : 'text-black dark:text-white'
                            }`}
                            style={{ fontFamily: 'Poppins_500Medium' }}>
                            {option.label}
                          </Text>
                        </View>
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
