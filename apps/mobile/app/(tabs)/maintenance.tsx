import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Maintenance() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id);
    if (mems && mems.length > 0 && mems[0]) {
      const { data } = await supabase.from('maintenance_requests').select('id,title,status,priority,created_at').eq('property_id', mems[0].property_id).order('created_at', { ascending: false }).limit(20);
      setItems(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id);
    if (!mems || mems.length === 0) { setSubmitting(false); return; }
    const { error } = await supabase.from('maintenance_requests').insert({
      property_id: mems[0].property_id,
      title,
      description: desc,
      reported_by: user.id,
      status: 'open',
      priority: 'medium',
    });
    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setTitle(''); setDesc(''); setShowForm(false);
    load();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Maintenance</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addButtonText}>{showForm ? 'Cancel' : '+ New'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Issue title" value={title} onChangeText={setTitle} />
          <TextInput style={[styles.input, styles.textarea]} placeholder="Description" value={desc} onChangeText={setDesc} multiline numberOfLines={3} />
          <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={submitting}>
            <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Request'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>No requests</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.status} • {item.priority}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  form: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: '#fff' },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#111827', padding: 12, borderRadius: 8 },
  submitButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 8 },
  cardTitle: { fontWeight: '600' },
  meta: { color: '#666', marginTop: 4, fontSize: 12 },
  empty: { color: '#666' },
});
