import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerForPushNotifications, addNotificationListener, addResponseListener } from '../services/notifications';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  useEffect(() => {
    // Register for push notifications on mount
    registerForPushNotifications().catch(console.error);

    // Listen for incoming notifications
    const notifSub = addNotificationListener((notification) => {
      console.log('Notification received:', notification.request.content);
    });

    // Listen for notification taps
    const respSub = addResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      // Navigate based on notification data if needed
    });

    return () => {
      notifSub.remove();
      respSub.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
