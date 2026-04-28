
-- 1) Current consent state per user per document
CREATE TABLE public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL, -- 'kvkk', 'acik_riza', 'terms', 'privacy', 'marketing_sms', 'marketing_email'
  document_version TEXT NOT NULL DEFAULT '1.0',
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type)
);

CREATE INDEX idx_user_consents_user ON public.user_consents(user_id);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents"
  ON public.user_consents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own consents"
  ON public.user_consents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own consents"
  ON public.user_consents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No DELETE policy: consent records cannot be deleted (legal audit requirement)

-- 2) Immutable audit log
CREATE TABLE public.consent_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  document_version TEXT NOT NULL,
  action TEXT NOT NULL, -- 'granted', 'revoked', 'updated'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_audit_user ON public.consent_audit_log(user_id);
CREATE INDEX idx_consent_audit_created ON public.consent_audit_log(created_at DESC);

ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit log"
  ON public.consent_audit_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- No INSERT/UPDATE/DELETE policies for users; only trigger (SECURITY DEFINER) writes here.

-- 3) Trigger: every change in user_consents writes an audit row
CREATE OR REPLACE FUNCTION public.log_consent_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := CASE WHEN NEW.granted THEN 'granted' ELSE 'revoked' END;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.granted = NEW.granted THEN
      v_action := 'updated';
    ELSIF NEW.granted THEN
      v_action := 'granted';
    ELSE
      v_action := 'revoked';
    END IF;
  END IF;

  INSERT INTO public.consent_audit_log
    (user_id, consent_type, document_version, action, ip_address, user_agent)
  VALUES
    (NEW.user_id, NEW.consent_type, NEW.document_version, v_action, NEW.ip_address, NEW.user_agent);

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_consent_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_log_consent_change
BEFORE INSERT OR UPDATE ON public.user_consents
FOR EACH ROW EXECUTE FUNCTION public.log_consent_change();

-- 4) Validation trigger to keep granted/revoked timestamps consistent
CREATE OR REPLACE FUNCTION public.normalize_consent_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.consent_type IS NULL OR length(NEW.consent_type) > 50 THEN
    RAISE EXCEPTION 'Geçersiz rıza tipi.' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.granted AND NEW.granted_at IS NULL THEN
    NEW.granted_at := now();
  END IF;
  IF NOT NEW.granted AND NEW.revoked_at IS NULL THEN
    NEW.revoked_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_consent_timestamps
BEFORE INSERT OR UPDATE ON public.user_consents
FOR EACH ROW EXECUTE FUNCTION public.normalize_consent_timestamps();
