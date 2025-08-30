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
import { userService } from '@/services/user.service';
import { User } from '@/types/user.types';

const EditProfile = () => {
  const { colorScheme } = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setName(userData.fullName || '');
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
        fullName: name.trim(),
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
              {user?.fullName || 'User'}
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
                className="mb-2 text-sm font-medium text-black dark:text-white"
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

          {/* Update Button */}
          <TouchableOpacity 
            onPress={handleUpdate}
            disabled={saving}
            className={`mt-8 rounded-lg py-4 ${
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

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
        )}
      </View>
    </View>
  );
};

export default EditProfile;
