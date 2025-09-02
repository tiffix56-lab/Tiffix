import { View, useWindowDimensions, Animated } from 'react-native';
import React from 'react';
import { useColorScheme } from 'nativewind';

interface PaginatorProps {
  data: any[];
  scrollX: Animated.Value;
}

const Paginator: React.FC<PaginatorProps> = ({ data, scrollX }) => {
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();

  return (
    <View style={{ height: 64, flexDirection: 'row' }}>
      {data.map((_: any, i: number) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 20, 10],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            style={{
              marginHorizontal: 8,
              height: 12,
              borderRadius: 6,
              backgroundColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
              width: dotWidth,
              opacity,
            }}
            key={i.toString()}
          />
        );
      })}
    </View>
  );
};

export default Paginator;
