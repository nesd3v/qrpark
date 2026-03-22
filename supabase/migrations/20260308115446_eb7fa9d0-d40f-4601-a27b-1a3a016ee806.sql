
-- Araçlar tablosu (plaka-telefon eşleşmesi)
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plate TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
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

-- RLS etkinleştir
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Vehicles: herkes plaka ile arama yapabilsin (QR okutunca), herkes kayıt ekleyebilsin (QR oluştururken)
CREATE POLICY "Anyone can lookup vehicles by plate"
  ON public.vehicles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can register a vehicle"
  ON public.vehicles FOR INSERT
  WITH CHECK (true);

-- Notifications: herkes bildirim gönderebilsin (QR okuyan kişi), herkes okuyabilsin (admin panel için)
CREATE POLICY "Anyone can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view notifications"
  ON public.notifications FOR SELECT
  USING (true);

-- Index for faster plate lookups
CREATE INDEX idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX idx_notifications_vehicle_id ON public.notifications(vehicle_id);
