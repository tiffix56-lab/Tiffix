import React, { useEffect } from 'react';
import { ScrollView, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notification.service';

// Import all components
import Header from '@/components/home/Header';
import Welcome from '@/components/home/Welcome';
import BannerCarousel from '@/components/home/BannerCarousel';
import Categories from '@/components/home/Categories';
import MealSubscriptions from '@/components/home/MealSubscriptions';
import ComingSoon from '@/components/home/ComingSoon';
import Testimonial from '@/components/home/Testimonial';
import ReferEarn from '@/components/home/ReferEarn';

const Home = () => {
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();

  useEffect(() => {
    const requestPermission = async () => {
      const enabled = await notificationService.requestUserPermission();
      if (!enabled) return;

      const fcmToken = await notificationService.getFCMToken();
      if (fcmToken) {
        await notificationService.sendTokenToServer(fcmToken);
      }
    };

    requestPermission();
  }, []);


  // Log when home screen renders
  useEffect(() => {
    console.log('🏠 [HOME_SCREEN] Rendered with user:', user?.name || 'null');
  }, [user]);

  // Log when home screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏠 [HOME_SCREEN] Focused with user:', user?.name || 'null');
    }, [user])
  );

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-black">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}>
        <Header />
        <Welcome key={user?.id || 'no-user'} />
        <BannerCarousel />
        <Categories />
        <MealSubscriptions />
        <ComingSoon />
        <Testimonial />
        <ReferEarn />
      </ScrollView>
    </View>
  );
};



export default Home;
