CREATE POLICY "Carrusel lectura publica" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'carrusel');
CREATE POLICY "Duena sube carrusel" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'carrusel' AND public.is_studio_owner());
CREATE POLICY "Duena actualiza carrusel" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'carrusel' AND public.is_studio_owner());
CREATE POLICY "Duena borra carrusel" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'carrusel' AND public.is_studio_owner());