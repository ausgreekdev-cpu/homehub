import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { fetchBills, createPaymentIntent, initStripePaymentSheet, presentStripePaymentSheet, recordPayment, Bill } from '../../services/payments';

export default function Payments() {
  const [items, setItems] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bills = await fetchBills();
      setItems(bills);
    } catch (e) {
      console.error('Failed to load bills', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handlePay(bill: Bill) {
    setPaying(bill.id);
    try {
      const { clientSecret, paymentIntentId } = await createPaymentIntent(bill.id, bill.total_amount);
      const initResult = await initStripePaymentSheet(clientSecret, bill.total_amount, bill.currency);
      if (initResult.error) {
        Alert.alert('Payment Error', initResult.error);
        setPaying(null);
        return;
      }
      const result = await presentStripePaymentSheet();
      if (result.success) {
        await recordPayment(bill.id, paymentIntentId, bill.total_amount);
        Alert.alert('Success', 'Payment completed successfully!');
        load();
      } else if (result.error && result.error !== 'Payment canceled') {
        Alert.alert('Payment Failed', result.error);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Payment failed');
    }
    setPaying(null);
  }

  const formatAmount = (cents: number, currency: string) => {
    return `${(currency || 'AUD').toUpperCase()} ${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#16a34a';
      case 'pending': return '#ca8a04';
      case 'overdue': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payments</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>No bills</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.amount}>{formatAmount(item.total_amount, item.currency)}</Text>
              <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>Due: {item.due_date || 'N/A'}</Text>
            {item.status !== 'paid' && (
              <TouchableOpacity
                style={[styles.payButton, paying === item.id && styles.payButtonDisabled]}
                onPress={() => handlePay(item)}
                disabled={paying === item.id}
              >
                {paying === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.payButtonText}>Pay Now</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 18, fontWeight: '700' },
  status: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  cardTitle: { fontWeight: '500', marginTop: 2 },
  meta: { color: '#666', marginTop: 4, fontSize: 12 },
  empty: { color: '#666' },
  payButton: { backgroundColor: '#111827', padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: '#fff', fontWeight: '600' },
});
