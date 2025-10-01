CREATE POLICY "Upload de capas para usuários autenticados"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'imagens');