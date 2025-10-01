CREATE POLICY "Leitura pública das capas"
ON storage.objects FOR SELECT
USING (bucket_id = 'imagens');