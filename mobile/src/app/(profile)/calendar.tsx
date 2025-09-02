import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const Calendar = () => {
  const { colorScheme } = useColorScheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const redHighlightedDates = [4, 8, 27]; // Dates to highlight in red
  const whiteHighlightedDates = [20, 22, 26]; // Dates to highlight in white

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Adjust for Monday as first day of week
    const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1;

    return { daysInMonth, adjustedStartingDay };
  };

  const { daysInMonth, adjustedStartingDay } = getDaysInMonth(currentMonth);

  const renderCalendarDays = () => {
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(
        <View key={`empty-${i}`} className="h-12 w-12 items-center justify-center">
          <Text className="text-transparent">1</Text>
        </View>
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isRedHighlighted = redHighlightedDates.includes(day);
      const isWhiteHighlighted = whiteHighlightedDates.includes(day);

      let backgroundColor = '';
      let textColor = '';

      if (isRedHighlighted) {
        backgroundColor = 'bg-red-500';
        textColor = 'text-white';
      } else if (isWhiteHighlighted) {
        backgroundColor = 'bg-white';
        textColor = 'text-black';
      } else {
        backgroundColor = '';
        textColor = colorScheme === 'dark' ? 'text-white' : 'text-black';
      }

      days.push(
        <TouchableOpacity
          key={day}
          className={`h-12 w-12 items-center justify-center rounded-lg ${backgroundColor}`}>
          <Text
            className={`text-sm font-medium ${textColor}`}
            style={{ fontFamily: 'Poppins_500Medium' }}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* More top margin */}
      <View className="h-12" />

      {/* Header with more height and rounded back button */}
      <View className="bg-zinc-50 px-6 pb-8 pt-8 dark:bg-neutral-900">
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
              Calendar
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main content with rounded top corners */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
          {/* Month Navigation */}
          <View className=" flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => changeMonth('prev')}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
              <Feather
                name="chevron-left"
                size={20}
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>

            <Text
              className="text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {getMonthName(currentMonth)}
            </Text>

            <TouchableOpacity
              onPress={() => changeMonth('next')}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
              <Feather
                name="chevron-right"
                size={20}
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View className="mb-4 flex-row justify-between">
            {daysOfWeek.map((day) => (
              <View key={day} className="h-12 w-12 items-center justify-center">
                <Text
                  className="text-sm font-medium text-white"
                  style={{ fontFamily: 'Poppins_500Medium' }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap justify-between gap-1">{renderCalendarDays()}</View>

          {/* Legend */}
          <View className="mt-8 rounded-lg border border-gray-200 p-4 dark:border-gray-600">
            <Text
              className="mb-3 text-base font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Legend
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-center">
                <View className="mr-3 h-4 w-4 rounded-lg bg-red-500" />
                <Text
                  className="text-sm text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  Special events or important dates
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="mr-3 h-4 w-4 rounded-lg border border-gray-300 bg-white" />
                <Text
                  className="text-sm text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  Regular events or appointments
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Calendar;
