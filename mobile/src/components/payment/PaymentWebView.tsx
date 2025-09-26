import React from 'react';
import { View, Modal, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { RazorpayOptions, PaymentResponse } from '@/context/PaymentContext';

interface PaymentWebViewProps {
  visible: boolean;
  razorpayOptions: RazorpayOptions;
  onPaymentResponse: (response: PaymentResponse) => void;
  onClose: () => void;
  generateHTML: (options: RazorpayOptions) => string;
}

const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  visible,
  razorpayOptions,
  onPaymentResponse,
  onClose,
  generateHTML,
}) => {
  const { colorScheme } = useColorScheme();

  const handleWebViewMessage = (event: any) => {
    try {
      const response: PaymentResponse = JSON.parse(event.nativeEvent.data);
      onPaymentResponse(response);
    } catch (error) {
      console.error('Error parsing payment response:', error);
      onPaymentResponse({
        success: false,
        error: 'PAYMENT_ERROR',
        message: 'Failed to process payment response'
      });
    }
  };

  if (!visible || !razorpayOptions) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent>
      <View className="flex-1 bg-white dark:bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-12 pb-4 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-700">
          <View className="flex-1">
            <Text
              className="text-lg font-semibold text-black dark:text-white"
              style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Complete Payment
            </Text>
            <Text
              className="text-sm text-zinc-500 dark:text-zinc-400 mt-1"
              style={{ fontFamily: 'Poppins_400Regular' }}>
              Secure payment powered by Razorpay
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Feather
              name="x"
              size={20}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <WebView
          source={{ html: generateHTML(razorpayOptions) }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          style={{ flex: 1 }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            onPaymentResponse({
              success: false,
              error: 'WEBVIEW_ERROR',
              message: 'Failed to load payment page'
            });
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP error:', nativeEvent);
            onPaymentResponse({
              success: false,
              error: 'NETWORK_ERROR', 
              message: 'Network error occurred'
            });
          }}
        />
      </View>
    </Modal>
  );
};

export default PaymentWebView;