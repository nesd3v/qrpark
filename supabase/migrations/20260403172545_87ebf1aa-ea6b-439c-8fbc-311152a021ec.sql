
CREATE TABLE public.corporate_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  vehicle_count INTEGER NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'filo',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID
);

ALTER TABLE public.corporate_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit corporate inquiry"
ON public.corporate_inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all inquiries"
ON public.corporate_inquiries FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update inquiries"
ON public.corporate_inquiries FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
