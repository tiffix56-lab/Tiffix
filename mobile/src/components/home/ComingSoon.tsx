import React from 'react';
import { View, Image } from 'react-native';

const ComingSoon = () => {
  return (
    <View className="my-4 px-0 pb-6">
      <View className="overflow-hidden rounded-md">
        <Image
          source={require('@/assets/coming-soon.png')}
          className="h-32 w-full"
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

export default ComingSoon;
