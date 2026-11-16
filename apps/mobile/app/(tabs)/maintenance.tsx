import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { cacheSet, cacheGet } from '../../services/offlineCache';
import { enqueueAction } from '../../services/syncQueue';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { pickImage, takePhoto, uploadImage, PickedImage } from '../../services/imageUpload';

export default function Maintenance() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PickedImage | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { isOffline } = useNetworkStatus();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id);
    if (mems && mems.length > 0 && mems[0]) {
      const cacheKey = `maintenance_${mems[0].property_id}`;
      if (isOffline) {
        const cached = await cacheGet<any[]>(cacheKey);
        if (cached) setItems(cached);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('maintenance_requests').select('id,title,status,priority,created_at,photo_url').eq('property_id', mems[0].property_id).order('created_at', { ascending: false }).limit(20);
      setItems(data || []);
      await cacheSet(cacheKey, data || []);
    }
    setLoading(false);
  }, [isOffline]);

  useEffect(() => { load(); }, [load]);

  async function handlePickImage() {
    const image = await pickImage();
    if (image) setSelectedImage(image);
  }

  async function handleTakePhoto() {
    const image = await takePhoto();
    if (image) setSelectedImage(image);
  }

  async function submit() {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    const { data: mems } = await supabase.from('property_memberships').select('property_id').eq('user_id', user.id);
    if (!mems || mems.length === 0) { setSubmitting(false); return; }

    let photoUrl: string | null = null;
    if (selectedImage) {
      setUploadingImage(true);
      photoUrl = await uploadImage(selectedImage);
      setUploadingImage(false);
      if (!photoUrl) {
        Alert.alert('Warning', 'Photo upload failed, submitting without photo');
      }
    }

    const payload: Record<string, unknown> = {
      property_id: mems[0].property_id,
      title,
      description: desc,
      reported_by: user.id,
      status: 'open',
      priority: 'medium',
      photo_url: photoUrl,
    };

    if (isOffline) {
      await enqueueAction('maintenance', payload);
      setItems((prev) => [{ id: `offline_${Date.now()}`, ...payload, created_at: new Date().toISOString() }, ...prev]);
      setSubmitting(false);
      Alert.alert('Queued', 'Request saved offline. Will sync when connected.');
      setTitle(''); setDesc(''); setSelectedImage(null); setShowForm(false);
      return;
    }

    const { error } = await supabase.from('maintenance_requests').insert(payload);
    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setTitle(''); setDesc(''); setSelectedImage(null); setShowForm(false);
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

          {/* Image picker */}
          <View style={styles.imageSection}>
            {selectedImage ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImage} onPress={() => setSelectedImage(null)}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                  <Text style={styles.imageButtonText}>📷 Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={handleTakePhoto}>
                  <Text style={styles.imageButtonText}>📸 Camera</Text>
                </TouchableOpacity>
              </View>
            )}
            {uploadingImage && <ActivityIndicator size="small" color="#111827" />}
          </View>

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
            {item.photo_url && (
              <Image source={{ uri: item.photo_url }} style={styles.cardImage} resizeMode="cover" />
            )}
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
  imageSection: { marginBottom: 8 },
  imageButtons: { flexDirection: 'row', gap: 8 },
  imageButton: { flex: 1, backgroundColor: '#e5e7eb', padding: 10, borderRadius: 8, alignItems: 'center' },
  imageButtonText: { fontWeight: '500', color: '#374151' },
  imagePreview: { position: 'relative', marginBottom: 8 },
  previewImage: { width: '100%', height: 150, borderRadius: 8 },
  removeImage: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  removeImageText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#111827', padding: 12, borderRadius: 8 },
  submitButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 8 },
  cardTitle: { fontWeight: '600' },
  meta: { color: '#666', marginTop: 4, fontSize: 12 },
  cardImage: { width: '100%', height: 120, borderRadius: 8, marginTop: 8 },
  empty: { color: '#666' },
});
