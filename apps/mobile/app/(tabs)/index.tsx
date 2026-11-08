import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HomeHub</Text>
      <Text style={styles.sub}>Signed in as {email || '…'}</Text>
      <Text style={styles.hint}>Use the tabs to view payments, maintenance, and messages.</Text>
      <TouchableOpacity style={styles.button} onPress={signOut}><Text style={styles.buttonText}>Sign out</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 26, fontWeight: 'bold' },
  sub: { color: '#555', marginTop: 6 },
  hint: { marginTop: 20, color: '#666' },
  button: { marginTop: 24, borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8 },
  buttonText: { textAlign: 'center' },
});
