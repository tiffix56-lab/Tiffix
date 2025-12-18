import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';

const { width } = Dimensions.get('window');

interface BannerItem {
  id: string;
  video: any;
}

const BannerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const banners: BannerItem[] = [
    { id: '1', video: require('@/assets/banner1.mp4') },
    { id: '2', video: require('@/assets/banner2.mp4') },
    { id: '3', video: require('@/assets/banner3.mp4') },
    { id: '4', video: require('@/assets/banner4.mp4') }
  ];

  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width - 48));
    setCurrentIndex(index);
  };

  // Auto Slide
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;

      if (nextIndex >= banners.length) {
        nextIndex = 0; // loop back
      }

      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <View className="pb-6">
      <FlatList
  ref={flatListRef}
  data={banners}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View
      className="relative mx-3 overflow-hidden rounded-xl "
      style={{ width: width - 48 }}
    >
      <Video
        source={item.video}
        style={{ width: '100%', height: 200 }}
        className=''
        shouldPlay
        isLooping
        isMuted
      />
    </View>
  )}
  horizontal
  showsHorizontalScrollIndicator={false}
  snapToInterval={width - 48}   // ⭐ important
  decelerationRate="fast"       // ⭐ smooth snapping
  onMomentumScrollEnd={onScroll}
  contentContainerStyle={{ paddingHorizontal: 12 }}
/>


      <View className="mt-4 flex-row justify-center">
        {banners.map((_, index) => (
          <TouchableOpacity
            key={index}
            className={`mx-1 h-2 w-2 rounded-full ${
              currentIndex === index ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-600'
            }`}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index, animated: true });
              setCurrentIndex(index);
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default BannerCarousel;
