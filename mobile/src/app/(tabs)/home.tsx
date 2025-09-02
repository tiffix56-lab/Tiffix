import React from 'react';
import { ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

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

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-black">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}>
        <Header />
        <Welcome />
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
