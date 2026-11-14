import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export default function Messages() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id);
    if (mems && mems.length > 0 && mems[0]) {
      const { data } = await supabase.from('notifications').select('id,title,body,read,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
      setItems(data || []);
    }
    setLoading(false);
  }, []);

  // Real-time subscription for new notifications
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`notifications:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload: any) => {
          setItems((prev) => [payload.new, ...prev]);
        })
        .subscribe();
    }

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>No messages</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.unread]}>
            <Text style={styles.cardTitle}>{item.title || 'Notification'}</Text>
            {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
            <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
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
  unread: { backgroundColor: '#f8fafc', borderLeftWidth: 3, borderLeftColor: '#111827' },
  cardTitle: { fontWeight: '600' },
  body: { color: '#555', marginTop: 4 },
  time: { color: '#999', marginTop: 4, fontSize: 11 },
  empty: { color: '#666' },
});
