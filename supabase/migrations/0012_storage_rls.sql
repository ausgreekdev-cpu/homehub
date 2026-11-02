-- Storage RLS policies for property-scoped access

-- inventory bucket
CREATE POLICY "inventory members read" ON storage.objects FOR SELECT USING (
  bucket_id = 'inventory' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "inventory members upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'inventory' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "inventory members update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'inventory' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "inventory members delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'inventory' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);

-- receipts bucket
CREATE POLICY "receipts members read" ON storage.objects FOR SELECT USING (
  bucket_id = 'receipts' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "receipts members upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "receipts members update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'receipts' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "receipts members delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'receipts' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);

-- documents bucket
CREATE POLICY "documents members read" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "documents members upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "documents members update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "documents members delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);

-- condition-reports bucket
CREATE POLICY "condition members read" ON storage.objects FOR SELECT USING (
  bucket_id = 'condition-reports' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "condition members upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'condition-reports' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "condition members update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'condition-reports' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
CREATE POLICY "condition members delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'condition-reports' AND EXISTS (
    SELECT 1 FROM public.property_memberships pm
    WHERE pm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = pm.property_id::text
  )
);
