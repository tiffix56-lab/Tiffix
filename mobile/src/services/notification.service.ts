import messaging from '@react-native-firebase/messaging';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import api from '@/lib/axios';

class NotificationService {
  private listenersInitialized = false;

  async requestUserPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission({
        alert: true,
        badge: true,
        sound: true,
      });

      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    }

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  }

  async getFCMToken(): Promise<string | null> {
    try {
      await messaging().registerDeviceForRemoteMessages();

      // 🔴 iOS APNs check (required)
      if (Platform.OS === 'ios') {
        const apnsToken = await messaging().getAPNSToken();
        if (!apnsToken) {
          return null;
        }
      }

      const token = await messaging().getToken();

      return token;
    } catch (error) {
      return null;
    }
  }

  async sendTokenToServer(token: string): Promise<void> {
    try {
      await api.post('/users/fcm-token', { token });
    } catch (error) {}
  }

  initializeNotificationListeners() {
    if (this.listenersInitialized) return;
    this.listenersInitialized = true;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    messaging().onMessage(async (remoteMessage) => {
      Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title ?? '',
          body: remoteMessage.notification?.body ?? '',
          data: remoteMessage.data,
        },
        trigger: null,
      });
    });

    messaging().onNotificationOpenedApp(() => {});
    messaging().getInitialNotification();
  }
}

export const notificationService = new NotificationService();
