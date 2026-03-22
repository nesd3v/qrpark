CREATE POLICY "Vehicle owners can delete their vehicles"
ON public.vehicles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());