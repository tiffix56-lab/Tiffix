import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';

const ReferEarn = () => {
  const { colorScheme } = useColorScheme();
  const router = useRouter();

  return (
    <View className="my-4 mx-6">
      <TouchableOpacity className="overflow-hidden rounded-xl"
      onPress={() => router.push('/(profile)/referral')}
      >
        <Image
          source={require('@/assets/refer-earn.png')}
          style={{ height: 128, width: '100%', resizeMode: 'cover' }}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ReferEarn;
