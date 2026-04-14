
CREATE TABLE public.sticker_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activated_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sticker_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read a sticker code to check if it's valid (needed during scan)
CREATE POLICY "Anyone can check sticker codes" ON public.sticker_codes
  FOR SELECT USING (true);

-- Authenticated users can activate (update) available sticker codes
CREATE POLICY "Authenticated users can activate sticker codes" ON public.sticker_codes
  FOR UPDATE TO authenticated
  USING (status = 'available')
  WITH CHECK (status = 'activated' AND activated_by = auth.uid());
