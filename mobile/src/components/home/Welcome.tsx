import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/user.service';

const Welcome = () => {
  const { user, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [currentMealTime, setCurrentMealTime] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('User');

  useEffect(() => {
    console.log("📛 [WELCOME] User update", {
      user,
      userName: user?.name,
      userDataName: userData?.name,
      timestamp: new Date().toISOString()
    });

    const nameToUse = user?.name || userData?.name;

    if (nameToUse) {
      const firstName = nameToUse.split(' ')[0];
      console.log("✅ [WELCOME] Setting displayName to:", firstName);
      setDisplayName(firstName);
    } else {
      console.log("⚠️ [WELCOME] No name found, using fallback 'User'");
      setDisplayName('User');
    }
  }, [user?.name, userData?.name, user]);

  const fetchUserData = useCallback(async () => {
    if (user) {
      try {
        const response = await userService.getUserProfile();
        console.log("UserRes", response);
        
        if (response.success && response.data) {
          setUserData(response.data.userProfile);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  }, [user]);

  const updateMealTime = useCallback(() => {
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
  }, []);

  useEffect(() => {
    fetchUserData();
    updateMealTime();

    const interval = setInterval(updateMealTime, 60000);
    return () => clearInterval(interval);
  }, [user, isAuthenticated, fetchUserData, updateMealTime]);


  return (
    <View className="px-6 pb-6">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            className="text-base text-zinc-600 dark:text-zinc-400"
            style={{ fontFamily: 'Poppins_400Regular' }}>
            Hi! {displayName},
          </Text>
          <Text
            className="text-2xl  text-black dark:text-white"
            style={{ fontFamily: 'DancingScript_700Bold' }}>
            {currentMealTime}
          </Text>
        </View>
        {/* <View className="relative">
          <Image
            source={{ uri: getUserAvatar() }}
            style={{ height: 48, width: 48, borderRadius: 24 }}
          />
          <View className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-black" />
        </View> */}
      </View>
    </View>
  );
};

export default Welcome;
