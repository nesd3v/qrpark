
-- Storage bucket for ruhsat photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('ruhsat-photos', 'ruhsat-photos', false);

-- RLS: authenticated users can upload their own ruhsat photos
CREATE POLICY "Users can upload ruhsat photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ruhsat-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: authenticated users can view their own ruhsat photos
CREATE POLICY "Users can view own ruhsat photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ruhsat-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: service role can view all (for AI verification edge function)
CREATE POLICY "Service role can view all ruhsat photos"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'ruhsat-photos');

-- Add verification columns to vehicles
ALTER TABLE public.vehicles
ADD COLUMN verification_status text NOT NULL DEFAULT 'pending',
ADD COLUMN ruhsat_photo_path text,
ADD COLUMN verification_note text;
