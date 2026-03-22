-- Add user_id and last_qr_generated_at to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN last_qr_generated_at timestamp with time zone;

-- Allow vehicles to be updated by their owner
CREATE POLICY "Vehicle owners can update their vehicles"
ON public.vehicles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Update insert policy to require auth and set user_id
DROP POLICY IF EXISTS "Anyone can register a vehicle" ON public.vehicles;
CREATE POLICY "Authenticated users can register vehicles"
ON public.vehicles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Keep select open for QR scanning
DROP POLICY IF EXISTS "Anyone can lookup vehicles by plate" ON public.vehicles;
CREATE POLICY "Anyone can lookup vehicles by plate"
ON public.vehicles
FOR SELECT
USING (true);