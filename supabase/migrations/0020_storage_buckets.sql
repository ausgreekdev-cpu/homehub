-- Storage buckets for maintenance photos and condition reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('maintenance-photos', 'maintenance-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('condition-reports', 'condition-reports', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS for maintenance-photos bucket
CREATE POLICY "Authenticated users can upload maintenance photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'maintenance-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view maintenance photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'maintenance-photos');

CREATE POLICY "Users can delete own maintenance photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'maintenance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS for condition-reports bucket
CREATE POLICY "Members can upload condition reports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'condition-reports' AND auth.role() = 'authenticated');

CREATE POLICY "Members can view condition reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'condition-reports' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own condition reports"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'condition-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
