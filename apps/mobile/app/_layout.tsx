import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { registerForPushNotifications, addNotificationListener, addResponseListener } from '../services/notifications';
import { supabase } from '../lib/supabase';

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications().catch(console.error);

    const notifSub = addNotificationListener((notification) => {
      console.log('Notification received:', notification.request.content);
    });

    const respSub = addResponseListener((response) => {
      console.log('Notification tapped:', response.notification.request.content.data);
    });

    return () => {
      notifSub.remove();
      respSub.remove();
    };
  }, []);

  return (
    <StripeProvider publishableKey={STRIPE_PK}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </StripeProvider>
  );
}
