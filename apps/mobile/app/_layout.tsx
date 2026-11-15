import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { registerForPushNotifications, addNotificationListener, addResponseListener } from '../services/notifications';
import { processQueue } from '../services/syncQueue';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineBanner from '../components/OfflineBanner';
import { View } from 'react-native';
import { supabase } from '../lib/supabase';

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function RootLayout() {
  const { isOffline } = useNetworkStatus();

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

  // Process sync queue when coming back online
  useEffect(() => {
    if (!isOffline) {
      processQueue().then(({ processed, failed }) => {
        if (processed > 0) console.log(`Synced ${processed} queued actions`);
        if (failed > 0) console.warn(`${failed} actions failed to sync`);
      });
    }
  }, [isOffline]);

  return (
    <StripeProvider publishableKey={STRIPE_PK}>
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </View>
    </StripeProvider>
  );
}
