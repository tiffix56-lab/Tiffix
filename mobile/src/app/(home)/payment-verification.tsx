import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, Alert, AppState, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { orderService } from '@/services/order.service';
import { orderStore } from '@/utils/order-store';

const PaymentVerification = () => {
  const { colorScheme } = useColorScheme();
  const { orderId, userSubscriptionId, amount } = useLocalSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [manualCheck, setManualCheck] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Please wait while we confirm your payment');

  useEffect(() => {
    // Listen for app state changes to detect when user returns from PhonePe
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && !verifying && !manualCheck) {
        // User returned to app, check payment status
        checkPaymentStatus();
      }
    };

    // Listen for deep links (when PhonePe redirects back)
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      
      // Parse URL to extract orderId
      try {
        const parsedUrl = new URL(url);
        const urlOrderId = parsedUrl.searchParams.get('orderId');
        
        console.log('Parsed deep link URL:', {
          url,
          host: parsedUrl.host,
          pathname: parsedUrl.pathname,
          orderId: urlOrderId,
          currentOrderId: orderId
        });
        
        // Handle PhonePe payment deep links
        if (url.includes('payment-success') || parsedUrl.host === 'payment-success') {
          console.log('Payment SUCCESS deep link detected');
          
          // Verify this is for the current payment
          if (urlOrderId && urlOrderId === orderId) {
            console.log('Order ID matches, checking payment status...');
            checkPaymentStatus();
          } else {
            console.log('Order ID mismatch or missing, still checking status...');
            checkPaymentStatus();
          }
        } else if (url.includes('payment-failed') || parsedUrl.host === 'payment-failed') {
          console.log('Payment FAILED deep link detected');
          Alert.alert(
            'Payment Failed',
            'Your payment was not successful. Please try again.',
            [
              {
                text: 'Try Again',
                onPress: () => router.back()
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error parsing deep link URL:', error);
        console.log('Fallback: checking payment status anyway...');
        checkPaymentStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Listen for initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for incoming URLs while app is running
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });
    
    // Auto-check after a delay (increased for PhonePe processing)
    const timeout = setTimeout(() => {
      if (!verifying) {
        checkPaymentStatus();
      }
    }, 5000);

    return () => {
      subscription?.remove();
      linkingSubscription?.remove();
      clearTimeout(timeout);
    };
  }, []);

  const checkPaymentStatus = async (retryCount = 0) => {
    const maxRetries = 5; // Increased retries for PhonePe processing
    const retryDelay = 3000; // 3 seconds between retries for better stability

    try {
      setVerifying(true);
      setRetryAttempt(retryCount + 1);
      setStatusMessage(retryCount > 0 ? `Checking payment status... (Attempt ${retryCount + 1}/${maxRetries + 1})` : 'Please wait while we confirm your payment');
      
      console.log(`Checking payment status for orderId: ${orderId}, attempt: ${retryCount + 1}`);

      // First check payment status using orderId (more reliable)
      let paymentStatusResponse;
      try {
        paymentStatusResponse = await orderService.checkPaymentStatus(orderId as string);
        console.log('Raw payment status response:', paymentStatusResponse);
      } catch (apiError) {
        console.log('Payment status API call failed:', apiError);
        // If API call fails, skip to subscription status check
      }

      if (paymentStatusResponse?.success && paymentStatusResponse.data) {
        const { status, paymentStatus, subscription } = paymentStatusResponse.data;
        
        console.log('Payment status check result:', { 
          status, 
          paymentStatus, 
          subscription: subscription ? 'present' : 'missing' 
        });
        
        // Check for various success indicators
        if ((status === 'success' || paymentStatus === 'completed') || 
            (subscription && subscription.status === 'active')) {
          // Payment was successful and processed
          await orderStore.clearOrderData();
          
          Alert.alert(
            'Payment Successful!',
            'Your subscription has been activated successfully.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  router.replace({
                    pathname: '/(home)/order-confirmed',
                    params: {
                      subscriptionId: '',
                      userSubscriptionId: subscription?.id || userSubscriptionId as string,
                      paymentId: orderId as string,
                    },
                  });
                }
              }
            ]
          );
          return;
        } else if (status === 'failed' || paymentStatus === 'failed') {
          console.log('Payment failed');
          Alert.alert(
            'Payment Failed',
            'Your payment was not successful. Please try again.',
            [
              {
                text: 'Try Again',
                onPress: () => router.back()
              }
            ]
          );
          return;
        }
      }

      // Fallback: Check subscription status if payment status check fails
      console.log('Fallback: Checking subscription status');
      let statusResponse;
      try {
        statusResponse = await orderService.checkSubscriptionStatus(userSubscriptionId as string);
      } catch (subscriptionError) {
        console.log('Subscription status API call failed:', subscriptionError);
        // If subscription status check fails, treat as pending and retry
        if (retryCount < maxRetries) {
          console.log(`Subscription API failed, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          setStatusMessage(`Verifying payment... Retrying in ${retryDelay/1000} seconds`);
          setTimeout(() => {
            checkPaymentStatus(retryCount + 1);
          }, retryDelay);
          return;
        } else {
          console.log('Max retries reached after subscription API failures, showing manual check');
          setStatusMessage('Unable to verify payment automatically');
          setManualCheck(true);
          return;
        }
      }

      if (statusResponse?.success && statusResponse.data) {
        const subscription = statusResponse.data.subscription;
        const status = subscription?.status || statusResponse.data.status;
        
        console.log('Subscription status check result:', {
          status,
          subscription: subscription ? 'present' : 'missing',
          subscriptionId: subscription?.id
        });
        
        if (status === 'active') {
          // Payment was successful and subscription is active
          await orderStore.clearOrderData();
          
          Alert.alert(
            'Payment Successful!',
            'Your subscription has been activated successfully.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  router.replace({
                    pathname: '/(home)/order-confirmed',
                    params: {
                      subscriptionId: '',
                      userSubscriptionId: subscription?.id || userSubscriptionId as string,
                      paymentId: orderId as string,
                    },
                  });
                }
              }
            ]
          );
          return;
        } else if (status === 'pending') {
          console.log('Subscription still pending - may need more time');
          
          // Retry logic for pending payments
          if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
            setStatusMessage(`Payment is being processed... Retrying in ${retryDelay/1000} seconds`);
            setTimeout(() => {
              checkPaymentStatus(retryCount + 1);
            }, retryDelay);
            return;
          } else {
            console.log('Max retries reached, showing manual check');
            setStatusMessage('Unable to verify payment automatically');
            setManualCheck(true);
          }
        } else {
          console.log('Subscription status unexpected:', status);
          setManualCheck(true);
        }
      } else {
        console.log('Failed to check subscription status - no valid response data');
        
        // Retry logic if both API calls failed
        if (retryCount < maxRetries) {
          console.log(`Both APIs failed, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          setStatusMessage(`Connection issue... Retrying in ${retryDelay/1000} seconds`);
          setTimeout(() => {
            checkPaymentStatus(retryCount + 1);
          }, retryDelay);
          return;
        } else {
          console.log('Max retries reached after API failures, showing manual check');
          setStatusMessage('Unable to verify payment automatically');
          setManualCheck(true);
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
      
      // Retry on error
      if (retryCount < maxRetries) {
        console.log(`Error occurred, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        setStatusMessage(`Something went wrong... Retrying in ${retryDelay/1000} seconds`);
        setTimeout(() => {
          checkPaymentStatus(retryCount + 1);
        }, retryDelay);
      } else {
        console.log('Max retries reached after errors, showing manual check');
        setStatusMessage('Unable to verify payment automatically');
        setManualCheck(true);
      }
    } finally {
      // Only set verifying to false if we're not going to retry
      if (retryCount >= maxRetries || manualCheck) {
        setVerifying(false);
      }
    }
  };

  const testDeepLink = () => {
    // Test deep link for debugging
    const testUrl = `tiffix://payment-success?orderId=${orderId}&userSubscriptionId=${userSubscriptionId}`;
    console.log('Testing deep link:', testUrl);
    handleDeepLink(testUrl);
  };

  const handleManualVerification = () => {
    Alert.alert(
      'Payment Status',
      'We are having trouble automatically verifying your payment. Please confirm your payment status:',
      [
        {
          text: 'Payment Failed',
          style: 'cancel',
          onPress: () => {
            router.back(); // Go back to payment screen
          }
        },
        {
          text: 'Try Auto-Check Again',
          onPress: () => {
            setManualCheck(false);
            setVerifying(false);
            // Restart the verification process
            setTimeout(() => {
              checkPaymentStatus(0);
            }, 500);
          }
        },
        {
          text: 'Payment Successful',
          onPress: async () => {
            // Show warning before allowing manual success
            Alert.alert(
              'Confirm Payment',
              'Are you sure you completed the payment successfully? This will activate your subscription.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: 'Yes, I Paid',
                  style: 'default',
                  onPress: async () => {
                    setVerifying(true);
                    try {
                      // One final check before manual success
                      const finalCheck = await orderService.checkPaymentStatus(orderId as string);
                      if (finalCheck.success && finalCheck.data?.status === 'success') {
                        // Payment was actually successful, proceed normally
                        await orderStore.clearOrderData();
                        router.replace({
                          pathname: '/(home)/order-confirmed',
                          params: {
                            subscriptionId: '',
                            userSubscriptionId: userSubscriptionId as string,
                            paymentId: orderId as string,
                          },
                        });
                      } else {
                        // Manual success - log for admin review
                        console.log('MANUAL_PAYMENT_SUCCESS:', {
                          orderId,
                          userSubscriptionId,
                          timestamp: new Date().toISOString(),
                          finalCheckResponse: finalCheck
                        });
                        
                        await orderStore.clearOrderData();
                        router.replace({
                          pathname: '/(home)/order-confirmed',
                          params: {
                            subscriptionId: '',
                            userSubscriptionId: userSubscriptionId as string,
                            paymentId: orderId as string,
                            manualVerification: 'true'
                          },
                        });
                      }
                    } catch (error) {
                      console.error('Final verification check failed:', error);
                      // Still proceed with manual verification
                      await orderStore.clearOrderData();
                      router.replace({
                        pathname: '/(home)/order-confirmed',
                        params: {
                          subscriptionId: '',
                          userSubscriptionId: userSubscriptionId as string,
                          paymentId: orderId as string,
                          manualVerification: 'true'
                        },
                      });
                    } finally {
                      setVerifying(false);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-neutral-900">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="bg-zinc-50 px-6 pb-6 pt-24 dark:bg-neutral-900">
        <View className="flex-row items-center">
          <View className="flex-1 items-center">
            <Text
              className="text-xl font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Payment Verification
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-3xl bg-white dark:bg-black">
        <View className="flex-1 items-center justify-center px-6">
          {verifying ? (
            <>
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              <Text
                className="mt-4 text-center text-lg font-medium text-black dark:text-white"
                style={{ fontFamily: 'Poppins_500Medium' }}>
                Verifying Payment...
              </Text>
              <Text
                className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                {statusMessage}
              </Text>
              {retryAttempt > 1 && (
                <Text
                  className="mt-1 text-center text-xs text-zinc-400 dark:text-zinc-500"
                  style={{ fontFamily: 'Poppins_400Regular' }}>
                  This may take a moment...
                </Text>
              )}
            </>
          ) : manualCheck ? (
            <>
              <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-blue-500">
                <Feather name="credit-card" size={48} color="#FFFFFF" />
              </View>
              <Text
                className="mb-2 text-center text-xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Payment Status Check
              </Text>
              <Text
                className="mb-8 text-center text-base text-zinc-500 dark:text-zinc-400"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                We're having trouble verifying your payment automatically. Please let us know the status.
              </Text>
              
              <View className="w-full space-y-4">
                <TouchableOpacity
                  onPress={handleManualVerification}
                  className="rounded-xl bg-blue-500 py-4">
                  <Text
                    className="text-center text-lg font-semibold text-white"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Check Payment Status
                  </Text>
                </TouchableOpacity>
                
                {__DEV__ && (
                  <TouchableOpacity
                    onPress={testDeepLink}
                    className="rounded-xl bg-green-500 py-3">
                    <Text
                      className="text-center text-sm font-medium text-white"
                      style={{ fontFamily: 'Poppins_500Medium' }}>
                      Test Deep Link (Debug)
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="rounded-xl border border-zinc-200 py-4 dark:border-zinc-700">
                  <Text
                    className="text-center text-lg font-medium text-black dark:text-white"
                    style={{ fontFamily: 'Poppins_500Medium' }}>
                    Back to Payment
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-green-500">
                <Feather name="check" size={48} color="#FFFFFF" />
              </View>
              <Text
                className="mb-2 text-center text-xl font-semibold text-black dark:text-white"
                style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Payment Initiated
              </Text>
              <Text
                className="mb-8 text-center text-base text-zinc-500 dark:text-zinc-400"
                style={{ fontFamily: 'Poppins_400Regular' }}>
                Complete your payment in PhonePe app and return here
              </Text>
              
              <TouchableOpacity
                onPress={checkPaymentStatus}
                className="w-full rounded-xl bg-black py-4 dark:bg-white">
                <Text
                  className="text-center text-lg font-semibold text-white dark:text-black"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  I've Completed Payment
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default PaymentVerification;