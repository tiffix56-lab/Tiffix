import React, { useState, useRef } from 'react';
import { View, Text, Image, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: any;
  discount: string;
}

const BannerCarousel = () => {
  const { colorScheme } = useColorScheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const banners: BannerItem[] = [
    {
      id: '1',
      title: 'Up to 50% Off',
      subtitle: 'For Breakfast',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      image: require('@/assets/banner-1.png'),
      discount: '50%',
    },
    {
      id: '2',
      title: 'BRUNCH',
      subtitle: 'Weekend Special',
      description: 'Enjoy our special weekend brunch with amazing discounts and fresh ingredients.',
      image: require('@/assets/banner-1.png'),
      discount: '30%',
    },
    {
      id: '3',
      title: 'Lunch Special',
      subtitle: 'Healthy Meals',
      description: 'Nutritious lunch options delivered fresh to your doorstep every day.',
      image: require('@/assets/banner-1.png'),
      discount: '40%',
    },
  ];

  const renderBanner = ({ item }: { item: BannerItem }) => (
    <View className="relative mx-3 overflow-hidden rounded-xl" style={{ width: width - 48 }}>
      <Image source={item.image} style={{ height: 200, width: '100%', resizeMode: 'cover' }} />
    </View>
  );

  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width - 48));
    setCurrentIndex(index);
  };

  return (
    <View className="pb-6">
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      />

      {/* Pagination Dots */}
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
