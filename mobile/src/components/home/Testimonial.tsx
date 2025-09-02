import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface TestimonialItem {
  id: string;
  name: string;
  comment: string;
  image: string;
}

const Testimonial = () => {
  const { colorScheme } = useColorScheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonialRef = useRef<FlatList>(null);

  const testimonials: TestimonialItem[] = [
    {
      id: '1',
      name: 'Mukul Parmar',
      comment:
        "Tiffix is a lifesaver for my busy schedule! The food tastes like it's straight from home, and the delivery is always on time.",
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '2',
      name: 'Priya Sharma',
      comment:
        'Amazing quality and taste! The subscription plans are very flexible and the customer service is excellent.',
      image:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '3',
      name: 'Ravi Kumar',
      comment:
        'Best decision ever! Fresh, homely food delivered right to my doorstep. Highly recommended!',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
  ];

  const renderTestimonial = ({ item }: { item: TestimonialItem }) => (
    <View style={{ width: width - 80 }} className="items-center px-4">
      <Image source={{ uri: item.image }} className="mb-4 h-16 w-16 rounded-full" />
      <Text
        className="mb-2 text-lg font-semibold text-black dark:text-white"
        style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {item.name}
      </Text>
      <Text
        className="text-center text-sm leading-5 text-zinc-600 dark:text-zinc-400"
        style={{ fontFamily: 'Poppins_400Regular' }}>
        "{item.comment}"
      </Text>
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
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width - 80));
    setCurrentIndex(index);
  };

  return (
    <View className="pb-6">
      <View className="mb-6 flex-row items-center justify-center">
        <Text
          className="text-2xl font-semibold text-black dark:text-white"
          style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Testimonial
        </Text>
      </View>

      <View className="mx-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
        <FlatList
          ref={testimonialRef}
          data={testimonials}
          renderItem={renderTestimonial}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onTestimonialScroll}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />

        <View className="mt-6 flex-row items-center justify-center">
          <TouchableOpacity
            onPress={prevTestimonial}
            className="mr-4 rounded-full bg-zinc-100 p-3 dark:bg-zinc-700">
            <Feather
              name="chevron-left"
              size={18}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={nextTestimonial}
            className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-700">
            <Feather
              name="chevron-right"
              size={18}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Testimonial;
