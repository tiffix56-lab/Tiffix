import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
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

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('[FCM] iOS permission:', enabled);
      return enabled;
    }

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }

    // Android < 13 → permission auto-granted
    return true;
  }

  async getFCMToken(): Promise<string | null> {
    try {
      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async sendTokenToServer(token: string): Promise<void> {
    try {
      await api.post('/users/fcm-token', { token });
    } catch (error) {
      console.error('Error sending FCM token:', error);
    }
  }

  initializeNotificationListeners() {
    if (this.listenersInitialized) return;
    this.listenersInitialized = true;

    Notifications.setNotificationHandler({
      handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // 🔹 Foreground messages
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

    // 🔹 App opened from background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Opened from background:', remoteMessage.notification);
    });

    // 🔹 App opened from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Opened from quit:', remoteMessage.notification);
        }
      });
  }
}

export const notificationService = new NotificationService();
