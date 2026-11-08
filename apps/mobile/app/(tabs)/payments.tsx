import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Payments() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('bills').select('id,title,total_amount,status,due_date,currency').order('due_date', { ascending: true }).limit(20);
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
            <Text style={styles.amount}>{item.currency || 'AUD'} {Number(item.total_amount || 0).toFixed(2)}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.status} • {item.due_date || ''}</Text>
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
  amount: { fontSize: 18, fontWeight: '700' },
  cardTitle: { fontWeight: '500', marginTop: 2 },
  meta: { color: '#666', marginTop: 4, fontSize: 12 },
  empty: { color: '#666' },
});
