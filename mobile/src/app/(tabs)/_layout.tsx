import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

export default function AppLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#171717' : '#FFFFFF',
          paddingBottom: 8,
          borderTopEndRadius: 20,
          borderTopStartRadius: 20,
          paddingTop: 8,
          height: 70,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Poppins_500Medium',
          marginTop: 8,
        },
        tabBarActiveTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`h-16 w-16 items-center justify-center rounded-full ${
                focused ? 'mb-8 bg-white text-black' : 'bg-transparent'
              }`}
              style={{
                padding: 10,
                elevation: focused ? 4 : 0,
                shadowColor: focused ? '#000' : 'transparent',
                shadowOffset: focused ? { width: 0, height: 2 } : { width: 0, height: 0 },
                shadowOpacity: focused ? 0.25 : 0,
                shadowRadius: focused ? 4 : 0,
              }}>
              <Feather name="home" size={24} color={focused ? '#000000' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          tabBarLabel: 'Subscription',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`h-16 w-16 items-center justify-center rounded-full ${
                focused ? 'mb-8 bg-white' : 'bg-transparent'
              }`}
              style={{
                padding: 10,
                elevation: focused ? 4 : 0,
                shadowColor: focused ? '#000' : 'transparent',
                shadowOffset: focused ? { width: 0, height: 2 } : { width: 0, height: 0 },
                shadowOpacity: focused ? 0.25 : 0,
                shadowRadius: focused ? 4 : 0,
              }}>
              <View className="relative">
                <Feather name="file-text" size={24} color={focused ? '#000000' : color} />
                <View
                  className={`absolute -right-1 -top-1 h-2 w-2 items-center justify-center rounded-full ${
                    focused ? 'bg-black' : 'bg-gray-400'
                  }`}>
                  <Feather
                    name="refresh-cw"
                    size={4}
                    color={focused ? '#FFFFFF' : colorScheme === 'dark' ? '#1F1F1F' : '#FFFFFF'}
                  />
                </View>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`h-16 w-16 items-center justify-center rounded-full ${
                focused ? 'mb-8 bg-white' : 'bg-transparent'
              }`}
              style={{
                padding: 10,
                elevation: focused ? 4 : 0,
                shadowColor: focused ? '#000' : 'transparent',
                shadowOffset: focused ? { width: 0, height: 2 } : { width: 0, height: 0 },
                shadowOpacity: focused ? 0.25 : 0,
                shadowRadius: focused ? 4 : 0,
              }}>
              <Feather name="user" size={24} color={focused ? '#000000' : color} />
            </View>
          ),
          href: '/profile',
        }}
      />
    </Tabs>
  );
}
