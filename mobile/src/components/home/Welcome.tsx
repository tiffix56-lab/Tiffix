import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/user.service';

const Welcome = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [currentMealTime, setCurrentMealTime] = useState<string>('');

  useEffect(() => {
    fetchUserData();
    updateMealTime();
    
    // Update meal time every minute
    const interval = setInterval(updateMealTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    if (user) {
      try {
        const response = await userService.getUserProfile();
        if (response.success && response.data) {
          setUserData(response.data.userProfile);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  };

  const updateMealTime = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 6 && hour < 11) {
      setCurrentMealTime('Breakfast Time!');
    } else if (hour >= 11 && hour < 16) {
      setCurrentMealTime('Lunch Time!');
    } else if (hour >= 16 && hour < 20) {
      setCurrentMealTime('Snack Time!');
    } else {
      setCurrentMealTime('Dinner Time!');
    }
  };

  const getUserName = () => {
    if (userData?.name) {
      return userData.name.split(' ')[0]; // Get first name only
    }
    return user?.name?.split(' ')[0] || 'User';
  };

  const getUserAvatar = () => {
    if (userData?.avatar) {
      return userData.avatar;
    }
    // Generate a placeholder avatar based on user name
    const name = getUserName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=48&background=000&color=fff`;
  };

  return (
    <View className="px-6 pb-6">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            className="text-base text-zinc-600 dark:text-zinc-400"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            Hi! {getUserName()},
          </Text>
          <Text
            className="text-2xl font-bold text-black dark:text-white"
            style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {currentMealTime}
          </Text>
        </View>
        <View className="relative">
          <Image
            source={{ uri: getUserAvatar() }}
            className="h-12 w-12 rounded-full"
          />
          <View className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-black" />
        </View>
      </View>
    </View>
  );
};

export default Welcome;
