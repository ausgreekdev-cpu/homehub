import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You are offline. Changes will sync when connected.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef3c7',
    padding: 8,
    alignItems: 'center',
  },
  text: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '500',
  },
});
