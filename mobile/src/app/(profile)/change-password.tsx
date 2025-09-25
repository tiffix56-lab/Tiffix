import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAuth } from '../../context/AuthContext';

const ChangePassword = () => {
  const { colorScheme } = useColorScheme();
  const { changePassword, isLoading } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
    return errors;
  };

  const validateForm = () => {
    const newErrors: { oldPassword?: string; newPassword?: string; confirmPassword?: string } = {};

    // Validate old password
    if (!oldPassword.trim()) {
      newErrors.oldPassword = 'Current password is required';
    }

    // Validate new password
    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = `Password must have: ${passwordErrors.join(', ')}`;
      } else if (newPassword === oldPassword) {
        newErrors.newPassword = 'New password must be different from current password';
      }
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below and try again.');
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      if (result.success) {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        Alert.alert('Success', 'Password changed successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormValid = oldPassword.trim() && newPassword.trim() && confirmPassword.trim() && 
                     newPassword === confirmPassword && validatePassword(newPassword).length === 0;

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
            <View>
              <View className={`min-h-14 flex-row items-center rounded-md border px-4 ${
                errors.oldPassword 
                  ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20' 
                  : 'border-zinc-100 bg-zinc-50 dark:border-zinc-400 dark:bg-black'
              }`}>
                <TextInput
                  value={oldPassword}
                  onChangeText={(text) => {
                    setOldPassword(text);
                    clearError('oldPassword');
                  }}
                  placeholder="Current password"
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
              {errors.oldPassword && (
                <Text className="mt-1 text-sm text-red-500 dark:text-red-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {errors.oldPassword}
                </Text>
              )}
            </View>

            {/* New Password */}
            <View>
              <View className={`min-h-14 flex-row items-center rounded-md border px-4 ${
                errors.newPassword 
                  ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20' 
                  : 'border-zinc-100 bg-zinc-50 dark:border-zinc-400 dark:bg-black'
              }`}>
                <TextInput
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    clearError('newPassword');
                  }}
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
              {errors.newPassword && (
                <Text className="mt-1 text-sm text-red-500 dark:text-red-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {errors.newPassword}
                </Text>
              )}
              {newPassword && !errors.newPassword && (
                <View className="mt-2">
                  <Text className="text-sm text-zinc-600 dark:text-zinc-400" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Password Requirements:
                  </Text>
                  {validatePassword(newPassword).map((req, index) => (
                    <View key={index} className="flex-row items-center mt-1">
                      <Feather name="x" size={12} color="#EF4444" />
                      <Text className="ml-2 text-xs text-red-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {req}
                      </Text>
                    </View>
                  ))}
                  {validatePassword(newPassword).length === 0 && (
                    <View className="flex-row items-center mt-1">
                      <Feather name="check" size={12} color="#10B981" />
                      <Text className="ml-2 text-xs text-green-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                        Password meets all requirements
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View>
              <View className={`min-h-14 flex-row items-center rounded-md border px-4 ${
                errors.confirmPassword 
                  ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20' 
                  : 'border-zinc-100 bg-zinc-50 dark:border-zinc-400 dark:bg-black'
              }`}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearError('confirmPassword');
                  }}
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
              {errors.confirmPassword && (
                <Text className="mt-1 text-sm text-red-500 dark:text-red-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {errors.confirmPassword}
                </Text>
              )}
              {confirmPassword && newPassword && confirmPassword === newPassword && !errors.confirmPassword && (
                <View className="flex-row items-center mt-1">
                  <Feather name="check" size={12} color="#10B981" />
                  <Text className="ml-2 text-xs text-green-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Passwords match
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            onPress={handleChangePassword}
            disabled={!isFormValid || isLoading}
            className={`mt-8 rounded-lg py-4 ${
              isFormValid && !isLoading 
                ? 'bg-black dark:bg-white' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}>
            <Text
              className={`text-center text-base font-medium ${
                isFormValid && !isLoading
                  ? 'text-white dark:text-black'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              style={{ fontFamily: 'Poppins_500Medium' }}>
              {isLoading ? 'Saving...' : 'Save'}
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
