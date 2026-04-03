-- Corporate members table: tracks approved corporate accounts
CREATE TABLE public.corporate_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inquiry_id uuid REFERENCES public.corporate_inquiries(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  plan_type text NOT NULL DEFAULT 'filo',
  max_vehicles integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.corporate_members ENABLE ROW LEVEL SECURITY;

-- Corporate members can read their own record
CREATE POLICY "Users can view own corporate membership"
  ON public.corporate_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins can manage corporate members"
  ON public.corporate_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));