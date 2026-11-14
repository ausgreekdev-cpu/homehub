import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Store token in Supabase for server-side push dispatch
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('push_tokens').upsert({
      user_id: user.id,
      token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });
  }

  return token;
}

export function addNotificationListener(callback: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export async function scheduleLocalNotification(title: string, body: string, seconds: number = 1) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { seconds },
  });
}
