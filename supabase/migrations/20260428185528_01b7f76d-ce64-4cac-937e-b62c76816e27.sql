
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_type TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS billing_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_tckn TEXT,
  ADD COLUMN IF NOT EXISTS billing_company TEXT,
  ADD COLUMN IF NOT EXISTS billing_vkn TEXT,
  ADD COLUMN IF NOT EXISTS billing_tax_office TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS billing_city TEXT,
  ADD COLUMN IF NOT EXISTS billing_email TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname='public' AND tablename='subscriptions'
       AND policyname='Users can update own subscription auto_renew'
  ) THEN
    CREATE POLICY "Users can update own subscription auto_renew"
      ON public.subscriptions
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
