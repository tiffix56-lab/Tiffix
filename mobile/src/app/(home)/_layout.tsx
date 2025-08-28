import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="meal-details" />
      <Stack.Screen name="order-confirmed" />
      <Stack.Screen name="order-information" />
      <Stack.Screen name="vendor-food" />
      <Stack.Screen name="home-chef" />
      <Stack.Screen name="information" />
      <Stack.Screen name="subscription" />
    </Stack>
  );
}
