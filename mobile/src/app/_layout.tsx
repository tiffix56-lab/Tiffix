import '../global.css';

import { Poppins_100Thin } from '@expo-google-fonts/poppins/100Thin';
import { Poppins_100Thin_Italic } from '@expo-google-fonts/poppins/100Thin_Italic';
import { Poppins_200ExtraLight } from '@expo-google-fonts/poppins/200ExtraLight';
import { Poppins_200ExtraLight_Italic } from '@expo-google-fonts/poppins/200ExtraLight_Italic';
import { Poppins_300Light } from '@expo-google-fonts/poppins/300Light';
import { Poppins_300Light_Italic } from '@expo-google-fonts/poppins/300Light_Italic';
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_400Regular_Italic } from '@expo-google-fonts/poppins/400Regular_Italic';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_500Medium_Italic } from '@expo-google-fonts/poppins/500Medium_Italic';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_600SemiBold_Italic } from '@expo-google-fonts/poppins/600SemiBold_Italic';
import { DancingScript_400Regular, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';

import { useFonts } from 'expo-font';
import { SplashScreen, Stack, Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '@/context/AuthContext';
import { AddressProvider } from '@/context/AddressContext';
import { PaymentProvider } from '@/context/PaymentContext';
import { toastConfig } from '@/components/ui/ToastConfig';
import { notificationService } from '@/services/notification.service';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_100Thin,
    Poppins_100Thin_Italic,
    Poppins_200ExtraLight,
    Poppins_200ExtraLight_Italic,
    Poppins_300Light,
    Poppins_300Light_Italic,
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_500Medium_Italic,
    Poppins_600SemiBold,
    Poppins_600SemiBold_Italic,
    DancingScript_400Regular,
    DancingScript_700Bold
  });
  
  const [isRouterReady, setIsRouterReady] = useState(false);

  useEffect(() => {
    notificationService.initializeNotificationListeners();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Small delay to ensure router is properly initialized
    const timer = setTimeout(() => {
      setIsRouterReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!isRouterReady) {
    return null;
  }

  return (
    <AuthProvider>
      <AddressProvider>
        <PaymentProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(home)" />
            <Stack.Screen name="(profile)" />
          </Stack>
          <Toast config={toastConfig} />
        </PaymentProvider>
      </AddressProvider>
    </AuthProvider>
  );
}
