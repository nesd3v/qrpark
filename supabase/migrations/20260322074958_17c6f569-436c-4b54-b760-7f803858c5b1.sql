
-- Araçlar tablosu
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plate TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_qr_generated_at timestamp with time zone,
  verification_status text NOT NULL DEFAULT 'pending',
  ruhsat_photo_path text,
  verification_note text,
  sms_enabled boolean NOT NULL DEFAULT true,
  call_enabled boolean NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bildirim geçmişi tablosu
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiller tablosu
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name text DEFAULT '',
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Subscriptions tablosu
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  merchant_oid text NOT NULL UNIQUE,
  plan_type text NOT NULL DEFAULT 'monthly',
  amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_date timestamptz,
  subscription_start timestamptz,
  subscription_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Support conversations tablosu
CREATE TABLE public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Support messages tablosu
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'user',
  sender_id uuid,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer - must be created before policies that use it)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Vehicles policies
CREATE POLICY "Anyone can lookup vehicles by plate" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can register vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Vehicle owners can update their vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Vehicle owners can delete their vehicles" ON public.vehicles FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Anyone can create notifications" ON public.notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view notifications" ON public.notifications FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service can manage subscriptions" ON public.subscriptions FOR ALL TO service_role USING (true);

-- Support conversations policies
CREATE POLICY "Users can create own conversations" ON public.support_conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own conversations" ON public.support_conversations FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own conversations" ON public.support_conversations FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Support messages policies
CREATE POLICY "Users can insert messages" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.support_conversations WHERE id = conversation_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Users can view messages" ON public.support_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.support_conversations WHERE id = conversation_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- User roles policies
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers: auto-create vehicle and profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_vehicle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'plate' IS NOT NULL AND NEW.raw_user_meta_data->>'phone' IS NOT NULL THEN
    INSERT INTO public.vehicles (plate, phone, user_id)
    VALUES (upper(trim(NEW.raw_user_meta_data->>'plate')), trim(NEW.raw_user_meta_data->>'phone'), NEW.id)
    ON CONFLICT (plate) DO UPDATE SET user_id = NEW.id, phone = trim(NEW.raw_user_meta_data->>'phone');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_vehicle();

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Indexes
CREATE INDEX idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX idx_notifications_vehicle_id ON public.notifications(vehicle_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;

-- Storage bucket for ruhsat photos
INSERT INTO storage.buckets (id, name, public) VALUES ('ruhsat-photos', 'ruhsat-photos', false);

CREATE POLICY "Users can upload ruhsat photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ruhsat-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own ruhsat photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ruhsat-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Service role can view all ruhsat photos" ON storage.objects FOR SELECT TO service_role USING (bucket_id = 'ruhsat-photos');
