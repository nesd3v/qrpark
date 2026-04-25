-- Server-side enforcement for vehicle limits per account_type
CREATE OR REPLACE FUNCTION public.enforce_vehicle_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_individual_count INT;
  v_has_individual_premium BOOLEAN;
  v_has_corporate_active BOOLEAN;
  v_legacy_corporate BOOLEAN;
BEGIN
  -- Only enforce on user-owned vehicles
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.account_type, 'individual') = 'individual' THEN
    SELECT COUNT(*) INTO v_individual_count
      FROM public.vehicles
     WHERE user_id = NEW.user_id
       AND COALESCE(account_type, 'individual') = 'individual';

    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions
       WHERE user_id = NEW.user_id
         AND status = 'active'
         AND COALESCE(account_type, 'individual') = 'individual'
         AND (subscription_end IS NULL OR subscription_end > now())
    ) INTO v_has_individual_premium;

    IF v_has_individual_premium THEN
      IF v_individual_count >= 5 THEN
        RAISE EXCEPTION 'Bireysel Premium en fazla 5 araç ekleyebilir (mevcut: %).', v_individual_count
          USING ERRCODE = 'check_violation';
      END IF;
    ELSE
      IF v_individual_count >= 1 THEN
        RAISE EXCEPTION 'Birden fazla bireysel araç eklemek için Premium aboneliği gereklidir.'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  ELSIF NEW.account_type = 'corporate' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.corporate_members
       WHERE user_id = NEW.user_id AND is_active = true
    ) INTO v_has_corporate_active;

    IF NOT v_has_corporate_active THEN
      RAISE EXCEPTION 'Kurumsal araç eklemek için aktif Kurumsal Premium üyeliği gereklidir.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_vehicle_limits ON public.vehicles;

CREATE TRIGGER trg_enforce_vehicle_limits
BEFORE INSERT ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_vehicle_limits();