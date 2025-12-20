import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { transactionService, Transaction } from '@/services/transaction.service';

const PaymentHistory = () => {
  const { colorScheme } = useColorScheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getUserTransactions();
      console.log(response.data?.transactions);
      
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
      } else {
        setError('Failed to load payment history');
      }
    } catch (err) {
      setError('Failed to load payment history');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculateTotalWithGST = (baseAmount: number) => {
    const gst = Math.round(baseAmount * 0.18); // 18% GST
    return baseAmount + gst;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    return istDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return { name: 'check-circle', color: '#10B981' };
      case 'failed':
        return { name: 'x-circle', color: '#EF4444' };
      case 'pending':
        return { name: 'clock', color: '#F59E0B' };
      case 'refunded':
        return { name: 'refresh-ccw', color: '#6B7280' };
      default:
        return { name: 'help-circle', color: '#6B7280' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'Processing';
      case 'refunded':
        return 'Refunded';
      default:
        return 'Unknown';
    }
  };

  // Group transactions by month
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.createdAt);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

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
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
            <Text className="mt-4 text-base text-zinc-500 dark:text-zinc-400">Loading payment history...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Feather name="alert-circle" size={48} color={colorScheme === 'dark' ? '#EF4444' : '#DC2626'} />
            <Text className="mt-4 text-center text-lg font-medium text-zinc-600 dark:text-zinc-300">
              {error}
            </Text>
            <TouchableOpacity 
              onPress={fetchTransactions}
              className="mt-4 rounded-xl bg-black px-6 py-3 dark:bg-white"
            >
              <Text className="text-white font-medium dark:text-black">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : transactions.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Feather name="credit-card" size={48} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
            <Text className="mt-4 text-center text-lg font-medium text-zinc-600 dark:text-zinc-300">
              No payment history found
            </Text>
            <Text className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Your payment transactions will appear here
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
            {/* Payment History List */}
            <View className="space-y-6">
              {Object.entries(groupedTransactions).map(([month, monthTransactions]) => (
                <View key={month}>
                  {/* Month Header
                  <Text
                    className="mb-4 text-lg font-semibold text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {month}
                  </Text> */}

                  {/* Transactions */}
                  <View className="mb-6 space-y-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
                    {monthTransactions.map((transaction) => {
                      const statusInfo = getStatusIcon(transaction.status);
                      return (
                        <View key={transaction._id} className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-800">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <Text
                                className="mb-1 text-base font-semibold text-black dark:text-white"
                                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                                Txn Id: {transaction.transactionId}
                              </Text>
                              <Text
                                className="mb-1 text-base font-semibold text-black dark:text-white"
                                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                                {transaction.subscriptionId?.planName || 'Subscription Purchase'}
                              </Text>
                              <View className="flex-row items-center">
                                <Feather name={statusInfo.name as any} size={16} color={statusInfo.color} />
                                <Text
                                  className="ml-2 text-sm text-gray-600 dark:text-gray-300"
                                  style={{ fontFamily: 'Poppins_400Regular' }}>
                                  {getStatusText(transaction.status)} • {formatDate(transaction.createdAt)}
                                </Text>
                              </View>
                              {transaction.gatewayPaymentId && (
                                <Text
                                  className="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
                                  style={{ fontFamily: 'Poppins_400Regular' }}>
                                  Payment ID: {transaction.gatewayPaymentId.slice(-8).toUpperCase()}
                                </Text>
                              )}
                            </View>
                            <View className="items-end">
                              <Text
                                className="text-lg font-semibold text-black dark:text-white"
                                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                                {formatCurrency(calculateTotalWithGST(transaction.finalAmount))}
                              </Text>
                              <Text
                                className="text-xs text-zinc-500 dark:text-zinc-400"
                                style={{ fontFamily: 'Poppins_400Regular' }}>
                                (incl. GST)
                              </Text>
                              {transaction.discountApplied > 0 && (
                                <Text
                                  className="text-sm text-green-600 dark:text-green-400"
                                  style={{ fontFamily: 'Poppins_400Regular' }}>
                                  -{formatCurrency(transaction.discountApplied)} discount
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {/* Bottom Spacing */}
            <View className="h-20" />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default PaymentHistory;
