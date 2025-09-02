import { View, TouchableOpacity, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { Svg, G, Circle } from 'react-native-svg';
import { AntDesign } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface NextButtonProps {
  percentage: number;
  scrollTo: () => void;
}

const NextButton: React.FC<NextButtonProps> = ({ percentage, scrollTo }) => {
  const { colorScheme } = useColorScheme();
  const size = 90;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  // Button size with proper padding from progress indicator
  const buttonSize = 60;

  const progressAnimation = useRef(new Animated.Value(0)).current;
  const progressRef = useRef<Circle>(null);

  const animation = (toValue: number) => {
    return Animated.timing(progressAnimation, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    animation(percentage);
  }, [percentage]);

  useEffect(() => {
    progressAnimation.addListener((value) => {
      const strokeDashoffset = circumference - (circumference * value.value) / 100;

      if (progressRef?.current) {
        progressRef.current.setNativeProps({
          strokeDashoffset,
        });
      }
    });

    return () => {
      progressAnimation.removeAllListeners();
    };
  }, []);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={center}>
          <Circle
            stroke={colorScheme === 'dark' ? '#374151' : '#F3F4F6'}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <Circle
            ref={progressRef}
            stroke={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <TouchableOpacity
        onPress={scrollTo}
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: buttonSize / 2,
          backgroundColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
          width: buttonSize,
          height: buttonSize,
        }}
        activeOpacity={0.7}>
        <AntDesign
          name="arrowright"
          size={20}
          color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'}
        />
      </TouchableOpacity>
    </View>
  );
};

export default NextButton;
