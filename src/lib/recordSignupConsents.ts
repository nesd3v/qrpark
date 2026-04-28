import { supabase } from "@/integrations/supabase/client";

const REQUIRED_CONSENTS = ["kvkk", "acik_riza", "terms", "privacy"] as const;

/**
 * Records the user's signup-time consent acceptance for KVKK, Açık Rıza,
 * Terms and Privacy. Skips any consent type already on file. Failures
 * are logged but never block the calling flow.
 */
export async function recordSignupConsents(userId: string) {
  try {
    const { data: existing } = await supabase
      .from("user_consents")
      .select("consent_type")
      .eq("user_id", userId)
      .in("consent_type", REQUIRED_CONSENTS as unknown as string[]);
    const have = new Set((existing || []).map((r) => r.consent_type));
    const missing = REQUIRED_CONSENTS.filter((t) => !have.has(t));
    if (missing.length === 0) return;

    const ua = navigator.userAgent.slice(0, 255);
    const rows = missing.map((type) => ({
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