import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { reviewService } from '@/services/review.service';

const Review = () => {
  const { colorScheme } = useColorScheme();
  const { orderId, subscriptionId, vendorId } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      setLoading(true);
      const response = await reviewService.createReview({
        orderId: orderId as string,
        subscriptionId: subscriptionId as string,
        vendorId: vendorId as string,
        rating,
        comment: comment.trim(),
      });

      if (response.success) {
        Alert.alert('Success', 'Review submitted successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to submit review');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = () => (
    <View className="flex-row justify-center mb-8">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          className="mx-2">
          <Feather
            name="star"
            size={32}
            color={star <= rating ? '#F59E0B' : '#D1D5DB'}
            fill={star <= rating ? '#F59E0B' : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View className="h-12" />

      {/* Header */}
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
              Write Review
            </Text>
          </View>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
          <Text
            className="mb-6 text-center text-lg font-medium text-gray-700 dark:text-gray-300"
            style={{ fontFamily: 'Poppins_500Medium' }}>
            How was your experience?
          </Text>

          <StarRating />

          <Text
            className="mb-4 text-base font-medium text-black dark:text-white"
            style={{ fontFamily: 'Poppins_500Medium' }}>
            Share your feedback
          </Text>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Tell us about your experience..."
            placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
            multiline
            numberOfLines={6}
            className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 text-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            style={{
              fontFamily: 'Poppins_400Regular',
              textAlignVertical: 'top',
              minHeight: 120,
            }}
          />

          <TouchableOpacity
            onPress={handleSubmitReview}
            disabled={loading || rating === 0}
            className={`rounded-lg py-4 ${
              loading || rating === 0
                ? 'bg-gray-300 dark:bg-gray-600'
                : 'bg-black dark:bg-white'
            }`}>
            {loading ? (
              <ActivityIndicator color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'} />
            ) : (
              <Text
                className={`text-center text-base font-medium ${
                  loading || rating === 0
                    ? 'text-gray-500'
                    : 'text-white dark:text-black'
                }`}
                style={{ fontFamily: 'Poppins_500Medium' }}>
                Submit Review
              </Text>
            )}
          </TouchableOpacity>

          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Review;