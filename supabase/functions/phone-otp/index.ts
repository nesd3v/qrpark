import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizePhone(raw: string): string {
  // Remove all non-digit characters except leading +
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  
  // Already has country code with +
  if (trimmed.startsWith("+90")) return `+${digits}`;
  
  // Starts with 90 (without +)
  if (digits.startsWith("90") && digits.length >= 12) return `+${digits}`;
  
  // Turkish local format: 0XXX or 5XX...
  if (digits.startsWith("0") && digits.length === 11) return `+90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("5")) return `+90${digits}`;
  
  // If it starts with + but not +90, keep as-is (international)
  if (trimmed.startsWith("+")) return `+${digits}`;
  
  // Fallback: assume Turkish
  return `+90${digits}`;
}

// In-memory OTP store (per isolate)
const otpStore = new Map<string, { code: string; expires: number; attempts: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, phone, code } = body;

    if (!action || !phone) {
      return new Response(
        JSON.stringify({ error: "action and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    if (action === "send") {
      // Check cooldown
      const existing = otpStore.get(normalizedPhone);
      if (existing && existing.expires > Date.now() && (existing.expires - Date.now()) > 4.5 * 60 * 1000) {
        return new Response(
          JSON.stringify({ error: "Lütfen 30 saniye bekleyin" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate 6-digit code
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));

      // Store with 5 min expiry
      otpStore.set(normalizedPhone, {
        code: otpCode,
        expires: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });

      // Send via Twilio
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const message = `QRPark dogrulama kodunuz: ${otpCode}. Bu kodu kimseyle paylasmayin.`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        },
        body: new URLSearchParams({ To: normalizedPhone, From: fromNumber, Body: message }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        console.error("Twilio OTP error:", errJson);
        return new Response(
          JSON.stringify({ error: "SMS gönderilemedi" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("OTP sent to", normalizedPhone);
      return new Response(
        JSON.stringify({ success: true, message: "Doğrulama kodu gönderildi" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!code) {
        return new Response(
          JSON.stringify({ error: "code is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const entry = otpStore.get(normalizedPhone);

      if (!entry) {
        return new Response(
          JSON.stringify({ error: "Doğrulama kodu bulunamadı. Lütfen yeni kod isteyin." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (entry.expires < Date.now()) {
        otpStore.delete(normalizedPhone);
        return new Response(
          JSON.stringify({ error: "Doğrulama kodunun süresi doldu. Lütfen yeni kod isteyin." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (entry.attempts >= 5) {
        otpStore.delete(normalizedPhone);
        return new Response(
          JSON.stringify({ error: "Çok fazla deneme. Lütfen yeni kod isteyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      entry.attempts++;

      if (entry.code !== code.trim()) {
        return new Response(
          JSON.stringify({ error: "Yanlış doğrulama kodu", remaining: 5 - entry.attempts }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Success
      otpStore.delete(normalizedPhone);

      // If vehicle_id provided, mark vehicle as verified
      if (body?.vehicle_id) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        await supabase
          .from("vehicles")
          .update({ verification_status: "verified", verification_note: "SMS ile araç sahibi tarafından doğrulandı" })
          .eq("id", body.vehicle_id);
      }

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'send' or 'verify'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("OTP error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
