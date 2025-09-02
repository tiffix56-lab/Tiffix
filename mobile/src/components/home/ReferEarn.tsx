import React from 'react';
import { View, Image } from 'react-native';
import { useColorScheme } from 'nativewind';

const ReferEarn = () => {
  const { colorScheme } = useColorScheme();

  return (
    <View className="my-4">
      <View className="overflow-hidden ">
        <Image
          source={
            colorScheme === 'dark'
              ? require('@/assets/refer-earn-dark.png')
              : require('@/assets/refer-earn-light.png')
          }
          className="h-48 "
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

export default ReferEarn;
