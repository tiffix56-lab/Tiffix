import { View, Text, FlatList, Animated, TouchableOpacity, Image } from 'react-native';
import React, { useState, useRef } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import OnboardingItem from '@/components/onboarding/OnboardingItem';
import Paginator from '@/components/onboarding/Paginator';
import NextButton from '@/components/onboarding/NextButton';
import { useColorScheme } from 'nativewind';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { storageService } from '@/services/storage.service';

const slides = [
  {
    id: '1',
    image: require('@/assets/onboarding/onboarding1.png'),
    title: 'Healthy Meals, Just Like Home',
  },
  {
    id: '2',
    image: require('@/assets/onboarding/onboarding2.png'),
    title: 'Punctual Deliveries, Every Day',
  },
  {
    id: '3',
    image: require('@/assets/onboarding/onboarding3.png'),
    title: 'Plans That Fit Your Routine',
  },
];

const Onboarding = () => {
  const { colorScheme } = useColorScheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems[0] && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = async () => {
    if (slidesRef.current && currentIndex < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await storageService.setOnboardingCompleted(true);
      router.replace('/(auth)/welcome');
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Top margin */}
      <View className="h-6" />

      <View className="w-full flex-row items-center justify-between px-6 pt-6">
        <Image
          source={
            colorScheme === 'dark'
              ? require('@/assets/logo-dark.png')
              : require('@/assets/logo.png')
          }
          className="h-20 w-32"
          resizeMode="contain"
        />
        <View className="flex-row items-center space-x-3">
          <ThemeToggle />
        </View>
      </View>
      <View style={{ flex: 3 }}>
        <FlatList
          data={slides}
          renderItem={({ item }) => <OnboardingItem item={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          scrollEventThrottle={32}
          ref={slidesRef}
        />
      </View>
      <Paginator data={slides} scrollX={scrollX} />
      <View className="mb-12">
        <NextButton scrollTo={scrollTo} percentage={(currentIndex + 1) * (100 / slides.length)} />
      </View>
    </View>
  );
};

export default Onboarding;
