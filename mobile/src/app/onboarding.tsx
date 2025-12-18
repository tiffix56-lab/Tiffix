import {
  View,
  Text,
  FlatList,
  Animated,
  Image,
  useWindowDimensions
} from 'react-native';
import React, { useState, useRef } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';

import Paginator from '@/components/onboarding/Paginator';
import NextButton from '@/components/onboarding/NextButton';
import { useColorScheme } from 'nativewind';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { storageService } from '@/services/storage.service';

const slides = [
  {
    id: '1',
    source: 'https://lottie.host/0c6464e0-522a-46af-871a-3a4f3d778d0f/BORsEqO6wS.json',
    title: 'Healthy Meals, Just Like Home',
  },
  {
    id: '2',
    source: 'https://lottie.host/7dd2ce56-7e84-4e1f-9b51-312035aea0fc/rHkAE5CvP2.json',
    title: 'Punctual Deliveries, Every Day',
  },
  {
    id: '3',
    source: 'https://lottie.host/55d9efe4-e6f0-4512-b421-aac1a6500654/NJtMpqI62V.json',
    title: 'Plans That Fit Your Routine',
  },
];

const Onboarding = () => {
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  // Detect visible slide
  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = async () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await storageService.setOnboardingCompleted(true);
      router.replace('/(auth)/welcome');
    }
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-black">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View className="w-full flex-row items-center justify-between px-6 pt-10">
        <Image
          source={
            colorScheme === 'dark'
              ? require('@/assets/logo-dark.png')
              : require('@/assets/logo.png')
          }
          style={{ height: 70, width: 160, resizeMode: 'contain' }}
        />
        <ThemeToggle />
      </View>

      {/* Slider */}
      <View style={{ flex: 3 }}>
        <FlatList
          data={slides}
          renderItem={({ item }) => (
            <View style={{ width, alignItems: 'center', justifyContent: 'center' }}>
              <Text className="text-4xl font-semibold text-center mt-3 dark:text-white text-black">
                {item.title}
              </Text>

              <LottieView
                source={{ uri: item.source }}
                autoPlay
                loop
                style={{ width: "100%", height: item.id === '2' ? 400 : 300, marginTop: 20 }}
              />
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>


      <View className="mb-12 mx-auto">
      <Paginator data={slides} scrollX={scrollX} />
        <NextButton
          scrollTo={scrollTo}
          percentage={(currentIndex + 1) * (100 / slides.length)}
        />
      </View>
    </View>
  );
};

export default Onboarding;
