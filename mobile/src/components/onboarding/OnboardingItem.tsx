import { View, Text, Image, useWindowDimensions, ImageSourcePropType } from 'react-native';
import React from 'react';
import { useColorScheme } from 'nativewind';
import { Video, ResizeMode } from 'expo-av';

interface OnboardingItemProps {
  item: {
    id: string;
    image?: ImageSourcePropType;
    video?: number;
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
      <Text className="mb-8 px-4 text-center text-3xl font-semibold text-black dark:text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {item.title}
      </Text>
      {item.video ? (
        <Video
          source={item.video}
          style={{ width: width * 0.8, height: width * 0.8 }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
          isMuted
        />
      ) : (
        <Image source={item.image!} style={{ width: width * 0.8, height: width * 0.8, resizeMode: 'contain' }} />
      )}
    </View>
  );
};

export default OnboardingItem;
