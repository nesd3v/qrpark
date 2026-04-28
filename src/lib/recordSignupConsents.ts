import { supabase } from "@/integrations/supabase/client";

const REQUIRED_CONSENTS = ["kvkk", "acik_riza", "terms", "privacy"] as const;

/**
 * Records the user's signup-time consent acceptance for KVKK, Açık Rıza,
 * Terms and Privacy. Failures are logged but never block the signup flow.
 */
export async function recordSignupConsents(userId: string) {
  try {
    const ua = navigator.userAgent.slice(0, 255);
    const rows = REQUIRED_CONSENTS.map((type) => ({
      user_id: userId,
      consent_type: type,
      granted: true,
      document_version: "1.0",
      user_agent: ua,
    }));
    await supabase
      .from("user_consents")
      .upsert(rows, { onConflict: "user_id,consent_type" });
  } catch (e) {
    console.warn("Consent recording failed:", e);
  }
}