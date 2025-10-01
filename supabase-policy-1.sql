CREATE POLICY "Leitura pública das capas de eventos"
ON storage.objects FOR SELECT
USING (bucket_id = 'imagens');