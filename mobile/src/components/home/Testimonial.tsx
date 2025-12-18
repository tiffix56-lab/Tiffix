import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Defs, ClipPath, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface TestimonialItem {
  id: string;
  name: string;
  subhead: string;
  comment: string;
  image: string;
  rating: number; // fixed
}

// ⭐ Full Star Component
const FullStar = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2.5l2.8 5.68 6.28.92-4.54 4.43 1.07 6.23L12 17.77l-5.61 2.99 1.07-6.23L2.92 9.1l6.28-.92L12 2.5z"
      fill="#F5C518"
      stroke="#D4A60A"
      strokeWidth={0.6}
      strokeLinejoin="round"
    />
  </Svg>
);

// ⭐ Half Star Component (same shape, left half filled)
const HalfStar = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <ClipPath id="half">
        <Rect x="0" y="0" width="12" height="24" />
      </ClipPath>
    </Defs>

    {/* Gold fill on left half */}
    <Path
      d="M12 2.5l2.8 5.68 6.28.92-4.54 4.43 1.07 6.23L12 17.77l-5.61 2.99 1.07-6.23L2.92 9.1l6.28-.92L12 2.5z"
      fill="#F5C518"
      clipPath="url(#half)"
    />

    {/* Full outline */}
    <Path
      d="M12 2.5l2.8 5.68 6.28.92-4.54 4.43 1.07 6.23L12 17.77l-5.61 2.99 1.07-6.23L2.92 9.1l6.28-.92L12 2.5z"
      fill="none"
      stroke="#D4A60A"
      strokeWidth={0.6}
      strokeLinejoin="round"
    />
  </Svg>
);

const Testimonial = () => {
  const { colorScheme } = useColorScheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonialRef = useRef<FlatList>(null);

  // ⭐ Render SVG stars according to rating
  const renderStars = (rating: number) => {
    const stars = [];
    let remaining = rating;

    for (let i = 0; i < 5; i++) {
      if (remaining >= 1) {
        stars.push(<FullStar key={i} />);
      } else if (remaining >= 0.5) {
        stars.push(<HalfStar key={i} />);
      } else {
        stars.push(<Text key={i} style={{ fontSize: 22 }}>☆</Text>); // empty star
      }
      remaining -= 1;
    }

    return <View className="flex-row gap-1 mt-1">{stars}</View>;
  };

  // ⭐ Hardcoded ratings
  const testimonials: TestimonialItem[] = [
    {
      id: '1',
      name: 'SEJAL DESHMUKH',
      subhead: 'BANKER, IDBI BANK',
      comment: "I’ve been using their service for over three months, and I couldn’t be happier.",
      image: 'https://tiffix.com/wp-content/uploads/2024/12/WhatsApp-Image-2024-12-19-at-13.36.09.jpeg',
      rating: 5,
    },
    {
      id: '2',
      name: 'Nikhil Patel',
      subhead: 'Software engineer / IIT Indore',
      comment: 'As a working professional, I rarely have time to cook. Tiffix has been a lifesaver!',
      image: 'https://tiffix.com/wp-content/uploads/2025/11/WhatsApp-Image-2025-11-24-at-12.17.32-PM.jpeg',
      rating: 4.8,
    },
    {
      id: '3',
      name: 'Sourav Sen',
      subhead: 'Foreign Exchange Trader',
      comment: 'I love the variety they offer in the Premium Plan.',
      image: 'https://tiffix.com/wp-content/uploads/2024/12/WhatsApp-Image-2024-12-19-at-13.36.10-1.jpeg',
      rating: 4.7,
    },
    {
      id: '4',
      name: 'Anshul Vijayawargiya',
      subhead: 'Student (CAT)',
      comment: 'I was initially worried about hygiene, but after trying their plan, I’m hooked.',
      image: 'https://tiffix.com/wp-content/uploads/2024/12/WhatsApp-Image-2024-12-19-at-13.36.11-1.jpeg',
      rating: 4.5,
    },
    {
      id: '5',
      name: 'Shashwat Vaidya',
      subhead: 'Chief Accounting Officer, MasterCard',
      comment: 'Tiffix has completely transformed my mealtime experience!',
      image: 'https://tiffix.com/wp-content/uploads/2024/12/WhatsApp-Image-2024-12-19-at-13.36.11.jpeg',
      rating: 4.9,
    },
  ];

  const renderTestimonial = ({ item }: { item: TestimonialItem }) => (
    <View className="flex flex-col justify-center items-center relative pt-8 w-[100vw] p-4">

      <Image
        source={{ uri: item.image }}
        className="absolute rounded-full w-20 h-20 top-0 left-1/2 -translate-x-1/3 z-10"
      />

      <View className="flex flex-col items-center justify-center bg-gray-100 dark:bg-zinc-900 pt-16 rounded-2xl p-5">
        
        <Text className="text-lg font-semibold text-black dark:text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {item.name}
        </Text>

        <Text className="text-sm font-semibold text-black dark:text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {item.subhead}
        </Text>

        {/* ⭐ SVG Stars */}
        {renderStars(item.rating)}

        <Text className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
          {item.rating.toFixed(1)} / 5.0
        </Text>

        <Text className="text-center mt-1 text-md leading-6 font-semibold text-zinc-600 dark:text-zinc-400" style={{ fontFamily: 'Poppins_400Regular' }}>
          "{item.comment}"
        </Text>
      </View>
    </View>
  );

  const nextTestimonial = () => {
    const nextIndex = (currentIndex + 1) % testimonials.length;
    setCurrentIndex(nextIndex);
    testimonialRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  const prevTestimonial = () => {
    const prevIndex = currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    testimonialRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  };

  const onTestimonialScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View className="pb-6">
      <View className="mb-6 flex-row items-center justify-center mt-10">
        <Text className="text-2xl font-semibold text-black dark:text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Customer Say's
        </Text>
      </View>

      <FlatList
        ref={testimonialRef}
        data={testimonials}
        renderItem={renderTestimonial}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onTestimonialScroll}
        keyExtractor={(item) => item.id}
      />

      <View className="mt-3 flex-row items-center justify-center">
        <TouchableOpacity onPress={prevTestimonial} className="mr-4 rounded-full bg-zinc-100 p-3 dark:bg-zinc-700">
          <Feather name="chevron-left" size={18} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>

        <TouchableOpacity onPress={nextTestimonial} className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-700">
          <Feather name="chevron-right" size={18} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Testimonial;
