
-- Create a trigger function to auto-create vehicle record from user metadata on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_vehicle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'plate' IS NOT NULL AND NEW.raw_user_meta_data->>'phone' IS NOT NULL THEN
    INSERT INTO public.vehicles (plate, phone, user_id)
    VALUES (
      upper(trim(NEW.raw_user_meta_data->>'plate')),
      trim(NEW.raw_user_meta_data->>'phone'),
      NEW.id
    )
    ON CONFLICT (plate) DO UPDATE SET
      user_id = NEW.id,
      phone = trim(NEW.raw_user_meta_data->>'phone');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_vehicle();
