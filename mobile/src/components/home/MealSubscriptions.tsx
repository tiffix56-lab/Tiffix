import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

const MealSubscriptions = () => {
  const mealSubscriptions = [
    {
      id: '1',
      title: 'Special Thali',
      image:
        'https://images.unsplash.com/photo-1742281258189-3b933879867a?q=80&w=735&auto=format&fit=crop',
    },
    {
      id: '2',
      title: 'Deluxe Thali',
      image:
        'https://images.unsplash.com/photo-1711153419402-336ee48f2138?q=80&w=1153&auto=format&fit=crop',
    },
    {
      id: '3',
      title: 'Standard Thali',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop',
    },
    {
      id: '4',
      title: 'Special Thali',
      image:
        'https://images.unsplash.com/photo-1742281258189-3b933879867a?q=80&w=735&auto=format&fit=crop',
    },
    {
      id: '5',
      title: 'Deluxe Thali',
      image:
        'https://images.unsplash.com/photo-1711153419402-336ee48f2138?q=80&w=1153&auto=format&fit=crop',
    },
    {
      id: '6',
      title: 'Standard Thali',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop',
    },
  ];

  return (
    <View className="pb-6">
      <View className="mb-6 flex-row items-center justify-center">
        <Text
          className="text-2xl font-semibold text-black dark:text-white"
          style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Meal Subscriptions
        </Text>
      </View>

      <View className="px-6">
        <View className="flex-row flex-wrap justify-between">
          {mealSubscriptions.map((meal, index) => (
            <View key={meal.id + index} className="mb-6 w-[30%] items-center">
              <TouchableOpacity className="items-center">
                <View className="relative">
                  <Image source={{ uri: meal.image }} className="h-20 w-20 rounded-full" />
                  <View className="absolute inset-0 rounded-full bg-black/10" />
                </View>
                <Text
                  className="mt-2 text-center text-sm font-medium text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  {meal.title}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default MealSubscriptions;
