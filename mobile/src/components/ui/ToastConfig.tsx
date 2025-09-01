import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';

const SuccessToast = (props: any) => {
  const colorScheme = useColorScheme();
  
  return (
    <View
      className={`mx-4 flex-row items-center rounded-xl p-4 shadow-lg ${
        colorScheme === 'dark' 
          ? 'bg-black border border-zinc-800' 
          : 'bg-white border border-zinc-200'
      }`}>
      <View
        className={`mr-3 h-8 w-8 items-center justify-center rounded-full ${
          colorScheme === 'dark' ? 'bg-green-900' : 'bg-green-100'
        }`}>
        <Feather
          name="check"
          size={16}
          color="#10B981"
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold ${
            colorScheme === 'dark' ? 'text-white' : 'text-black'
          }`}
          style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {props.text1}
        </Text>
        {props.text2 && (
          <Text
            className={`text-xs ${
              colorScheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}
            style={{ fontFamily: 'Poppins_400Regular' }}>
            {props.text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const ErrorToast = (props: any) => {
  const colorScheme = useColorScheme();
  
  return (
    <View
      className={`mx-4 flex-row items-center rounded-xl p-4 shadow-lg ${
        colorScheme === 'dark' 
          ? 'bg-black border border-zinc-800' 
          : 'bg-white border border-zinc-200'
      }`}>
      <View
        className={`mr-3 h-8 w-8 items-center justify-center rounded-full ${
          colorScheme === 'dark' ? 'bg-red-900' : 'bg-red-100'
        }`}>
        <Feather
          name="x"
          size={16}
          color="#EF4444"
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold ${
            colorScheme === 'dark' ? 'text-white' : 'text-black'
          }`}
          style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {props.text1}
        </Text>
        {props.text2 && (
          <Text
            className={`text-xs ${
              colorScheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}
            style={{ fontFamily: 'Poppins_400Regular' }}>
            {props.text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const InfoToast = (props: any) => {
  const colorScheme = useColorScheme();
  
  return (
    <View
      className={`mx-4 flex-row items-center rounded-xl p-4 shadow-lg ${
        colorScheme === 'dark' 
          ? 'bg-black border border-zinc-800' 
          : 'bg-white border border-zinc-200'
      }`}>
      <View
        className={`mr-3 h-8 w-8 items-center justify-center rounded-full ${
          colorScheme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'
        }`}>
        <Feather
          name="info"
          size={16}
          color="#3B82F6"
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold ${
            colorScheme === 'dark' ? 'text-white' : 'text-black'
          }`}
          style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {props.text1}
        </Text>
        {props.text2 && (
          <Text
            className={`text-xs ${
              colorScheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}
            style={{ fontFamily: 'Poppins_400Regular' }}>
            {props.text2}
          </Text>
        )}
      </View>
    </View>
  );
};

export const toastConfig = {
  success: SuccessToast,
  error: ErrorToast,
  info: InfoToast,
};