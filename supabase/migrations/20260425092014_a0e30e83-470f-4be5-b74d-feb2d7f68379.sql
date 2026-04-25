-- 1) subscriptions: add account_type
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'individual';

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_account_type_check
  CHECK (account_type IN ('individual','corporate'));

-- 2) vehicles: add account_type (default individual)
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'individual';

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_account_type_check
  CHECK (account_type IN ('individual','corporate'));

-- 3) corporate_inquiries: add payment_status
ALTER TABLE public.corporate_inquiries
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required';

ALTER TABLE public.corporate_inquiries
  ADD CONSTRAINT corporate_inquiries_payment_status_check
  CHECK (payment_status IN ('not_required','pending_payment','paid'));

-- 4) Allow users to view their own corporate inquiries (so client can poll status)
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.corporate_inquiries;
CREATE POLICY "Users can view own inquiries"
  ON public.corporate_inquiries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_account_status
  ON public.subscriptions (user_id, account_type, status);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_account
  ON public.vehicles (user_id, account_type);

CREATE INDEX IF NOT EXISTS idx_corporate_inquiries_user
  ON public.corporate_inquiries (user_id, status);