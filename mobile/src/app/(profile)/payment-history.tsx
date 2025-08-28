import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const PaymentHistory = () => {
  const { colorScheme } = useColorScheme();

  const paymentHistory = [
    {
      month: "May '25",
      transactions: [
        {
          id: '1',
          bank: 'IDFC BANK .. 6688',
          date: '6th may 8:16 pm',
          amount: '₹6969',
          status: 'success',
        },
        {
          id: '2',
          bank: 'IDFC BANK .. 6688',
          date: '6th may 8:16 pm',
          amount: '₹6969',
          status: 'success',
        },
      ],
    },
    {
      month: "April '25",
      transactions: [
        {
          id: '3',
          bank: 'IDFC BANK .. 6688',
          date: '6th may 8:16 pm',
          amount: '₹6969',
          status: 'success',
        },
        {
          id: '4',
          bank: 'IDFC BANK .. 6688',
          date: '6th may 8:16 pm',
          amount: '₹6969',
          status: 'success',
        },
        {
          id: '5',
          bank: 'IDFC BANK .. 6688',
          date: '6th may 8:16 pm',
          amount: '₹6969',
          status: 'success',
        },
        {
          id: '6',
          bank: 'IDFC BANK .. 6688',
          date: '6th may 8:16 pm',
          amount: '₹6969',
          status: 'success',
        },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="bg-zinc-50 px-6 pb-6 pt-24 dark:bg-neutral-900">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
            <Feather
              name="arrow-left"
              size={20}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text
              className="text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Payment History
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Payment History List */}
          <View className="space-y-6 ">
            {paymentHistory.map((monthData) => (
              <View key={monthData.month}>
                {/* Month Header */}
                <Text
                  className="mb-4 text-lg font-semibold text-black dark:text-white"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {monthData.month}
                </Text>

                {/* Transactions */}
                <View className="mb-6 space-y-4 border-b border-zinc-500 pb-6 dark:border-zinc-800">
                  {monthData.transactions.map((transaction) => (
                    <View key={transaction.id} className={`rounded-lg  p-4 `}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text
                            className="mb-1 text-base font-semibold text-black dark:text-white"
                            style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            {transaction.bank}
                          </Text>
                          <View className="flex-row items-center">
                            <Feather name="check-circle" size={16} color="#10B981" />
                            <Text
                              className="ml-2 text-sm text-gray-600 dark:text-gray-300"
                              style={{ fontFamily: 'Poppins_400Regular' }}>
                              {transaction.date}
                            </Text>
                          </View>
                        </View>
                        <Text
                          className="text-lg font-semibold text-black dark:text-white"
                          style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {transaction.amount}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default PaymentHistory;
