import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const EditProfile = () => {
  const { colorScheme } = useColorScheme();
  const [name, setName] = useState('Mukul Parmar');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState('Male');

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
              Mukul Parmar
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-12   " showsVerticalScrollIndicator={false}>
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
            <TouchableOpacity className="min-h-14 flex-row items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-400 dark:bg-black">
              <Text
                className="text-base text-black dark:text-white"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                {gender}
              </Text>
              <Feather
                name="chevron-down"
                size={16}
                color={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
              />
            </TouchableOpacity>
          </View>

          {/* Update Button */}
          <TouchableOpacity className="mt-8 rounded-lg bg-black py-4 dark:bg-white">
            <Text
              className="text-center text-base font-medium text-white dark:text-black"
              style={{ fontFamily: 'Poppins_500Medium' }}>
              Update
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default EditProfile;
