import React from 'react';
import { View, Image } from 'react-native';

const ComingSoon = () => {
  return (
    <View className="my-4 mx-6">
      <View className="overflow-hidden rounded-xl">
        <Image
          source={require('@/assets/30min.png')}
          style={{ height: 128, width: '100%', resizeMode: 'cover' }}
        />
      </View>
    </View>
  );
};

export default ComingSoon;
