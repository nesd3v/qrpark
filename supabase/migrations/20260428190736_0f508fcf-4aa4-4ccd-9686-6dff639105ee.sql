
-- 1) Fix search_path on remaining functions
CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pgmq'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pgmq'
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pgmq'
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pgmq'
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

-- 2) Revoke EXECUTE on internal SECURITY DEFINER functions from anon & authenticated.
-- These functions are only meant to be called by edge functions (service_role) or via triggers.
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_vehicle() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_vehicle_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_phone_exists(text) FROM PUBLIC, anon;

-- has_role is invoked by RLS policies, must remain executable by authenticated.
-- Just ensure anon cannot call it directly.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- check_phone_exists may be called during signup flow by service_role only.
GRANT EXECUTE ON FUNCTION public.check_phone_exists(text) TO service_role;

-- 3) Validation trigger for notifications (anti-abuse)
CREATE OR REPLACE FUNCTION public.validate_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plate IS NULL OR length(trim(NEW.plate)) < 3 OR length(NEW.plate) > 20 THEN
    RAISE EXCEPTION 'Geçersiz plaka.' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.issue_type IS NULL OR length(NEW.issue_type) > 50 THEN
    RAISE EXCEPTION 'Geçersiz bildirim tipi.' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.note IS NOT NULL AND length(NEW.note) > 500 THEN
    RAISE EXCEPTION 'Not 500 karakteri aşamaz.' USING ERRCODE = 'check_violation';
  END IF;
  -- Ensure the vehicle exists
  IF NOT EXISTS (SELECT 1 FROM public.vehicles WHERE id = NEW.vehicle_id) THEN
    RAISE EXCEPTION 'Araç bulunamadı.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_notification_trigger ON public.notifications;
CREATE TRIGGER validate_notification_trigger
BEFORE INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.validate_notification();

-- 4) Validation trigger for corporate_inquiries (anti-spam)
CREATE OR REPLACE FUNCTION public.validate_corporate_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.company_name IS NULL OR length(trim(NEW.company_name)) < 2 OR length(NEW.company_name) > 200 THEN
    RAISE EXCEPTION 'Geçersiz firma adı.' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.contact_email IS NULL OR NEW.contact_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Geçersiz e-posta.' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.contact_phone IS NULL OR length(trim(NEW.contact_phone)) < 7 OR length(NEW.contact_phone) > 25 THEN
    RAISE EXCEPTION 'Geçersiz telefon.' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.vehicle_count IS NULL OR NEW.vehicle_count < 1 OR NEW.vehicle_count > 100000 THEN
    RAISE EXCEPTION 'Geçersiz araç sayısı.' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.message IS NOT NULL AND length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Mesaj 2000 karakteri aşamaz.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_corporate_inquiry_trigger ON public.corporate_inquiries;
CREATE TRIGGER validate_corporate_inquiry_trigger
BEFORE INSERT ON public.corporate_inquiries
FOR EACH ROW EXECUTE FUNCTION public.validate_corporate_inquiry();
