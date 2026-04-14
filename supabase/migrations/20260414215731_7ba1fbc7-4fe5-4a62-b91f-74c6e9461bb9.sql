
-- Allow service role to insert and delete sticker codes (used by admin-panel edge function)
CREATE POLICY "Service role can insert sticker codes" ON public.sticker_codes
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can delete sticker codes" ON public.sticker_codes
  FOR DELETE TO service_role
  USING (true);
