
-- Create martyr_images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('martyr-images', 'martyr-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Martyr images publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'martyr-images');

-- Authenticated users (contributors+) can upload
CREATE POLICY "Authenticated can upload martyr images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'martyr-images');

-- Admins and founders can delete images
CREATE POLICY "Admins can delete martyr images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'martyr-images' AND public.is_admin());
