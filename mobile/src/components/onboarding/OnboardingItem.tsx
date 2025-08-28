import { View, Text, Image, useWindowDimensions, ImageSourcePropType } from 'react-native';
import React from 'react';
import { useColorScheme } from 'nativewind';

interface OnboardingItemProps {
  item: {
    id: string;
    image: ImageSourcePropType;
    title: string;
  };
}

const OnboardingItem: React.FC<OnboardingItemProps> = ({ item }) => {
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        width,
      }}>
      <Text className="mb-8 px-4 text-center text-3xl font-semibold text-black dark:text-white">
        {item.title}
      </Text>
      <Image source={item.image} className="h-96 w-96" style={{ width, resizeMode: 'contain' }} />
    </View>
  );
};

export default OnboardingItem;
