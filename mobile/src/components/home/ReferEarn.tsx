import React from 'react';
import { View, Image } from 'react-native';
import { useColorScheme } from 'nativewind';

const ReferEarn = () => {
  const { colorScheme } = useColorScheme();

  return (
    <View className="my-4 mx-6">
      <View className="overflow-hidden rounded-xl">
        <Image
          source={
            colorScheme === 'dark'
              ? require('@/assets/refer-earn-dark.png')
              : require('@/assets/refer-earn-light.png')
          }
          style={{ height: 192, width: '100%', resizeMode: 'cover' }}
        />
      </View>
    </View>
  );
};

export default ReferEarn;
