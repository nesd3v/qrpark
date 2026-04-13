
-- Add vehicle details columns
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS color text;

-- Create sticker orders table
CREATE TABLE public.sticker_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  plate text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  address text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sticker_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sticker orders" ON public.sticker_orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create sticker orders" ON public.sticker_orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all sticker orders" ON public.sticker_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
