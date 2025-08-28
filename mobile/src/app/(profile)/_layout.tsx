import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="profile" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="my-subscription" />
      <Stack.Screen name="address" />
      <Stack.Screen name="payment-history" />
      <Stack.Screen name="complain" />
      <Stack.Screen name="referral" />
      <Stack.Screen name="about-us" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="contact-us" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="privacy-policy" />
    </Stack>
  );
}
