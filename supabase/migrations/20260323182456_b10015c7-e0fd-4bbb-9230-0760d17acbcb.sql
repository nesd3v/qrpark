
-- Create storage bucket for support chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can upload to their conversation folder
CREATE POLICY "Users can upload support attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM support_conversations WHERE user_id = auth.uid()
  )
);

-- RLS: Users can view attachments from their own conversations, admins can view all
CREATE POLICY "Users can view support attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM support_conversations WHERE user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  )
);

-- Add attachment_url column to support_messages
ALTER TABLE public.support_messages
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text;
