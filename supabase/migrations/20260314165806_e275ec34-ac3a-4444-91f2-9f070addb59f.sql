ALTER TABLE public.vehicles 
ADD COLUMN sms_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN call_enabled boolean NOT NULL DEFAULT false;