-- Add optional email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;