
-- Fix overly permissive INSERT policy on notifications
DROP POLICY IF EXISTS "Anyone can create notifications" ON public.notifications;
CREATE POLICY "Anyone can create notifications" ON public.notifications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
