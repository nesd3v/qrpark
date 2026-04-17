import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+90")) return `+${digits}`;
  if (digits.startsWith("90") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("5")) return `+90${digits}`;
  if (trimmed.startsWith("+")) return `+${digits}`;
  return `+90${digits}`;
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

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
    const supabase = getSupabase();

    if (action === "send") {
      // Check cooldown - any code created in last 30 seconds
      const { data: recent } = await supabase
        .from("otp_codes")
        .select("created_at")
        .eq("phone", normalizedPhone)
        .gte("created_at", new Date(Date.now() - 30 * 1000).toISOString())
        .limit(1);

      if (recent && recent.length > 0) {
        return new Response(
          JSON.stringify({ error: "Lütfen 30 saniye bekleyin" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete old codes for this phone
      await supabase.from("otp_codes").delete().eq("phone", normalizedPhone);

      // Generate 6-digit code
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));

      // Store in DB with 5 min expiry
      await supabase.from("otp_codes").insert({
        phone: normalizedPhone,
        code: otpCode,
        vehicle_id: body.vehicle_id || null,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
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

      // Find valid OTP entry
      const { data: entry } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("phone", normalizedPhone)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!entry) {
        return new Response(
          JSON.stringify({ error: "Doğrulama kodu bulunamadı veya süresi doldu. Lütfen yeni kod isteyin." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (entry.attempts >= 5) {
        await supabase.from("otp_codes").delete().eq("id", entry.id);
        return new Response(
          JSON.stringify({ error: "Çok fazla deneme. Lütfen yeni kod isteyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Increment attempts
      await supabase.from("otp_codes").update({ attempts: entry.attempts + 1 }).eq("id", entry.id);

      if (entry.code !== code.trim()) {
        return new Response(
          JSON.stringify({ error: "Yanlış doğrulama kodu", remaining: 4 - entry.attempts }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Success - delete OTP
      await supabase.from("otp_codes").delete().eq("id", entry.id);

      // If vehicle_id provided (from send or from verify body), mark vehicle as verified
      const vehicleId = body.vehicle_id || entry.vehicle_id;
      if (vehicleId) {
        await supabase
          .from("vehicles")
          .update({ verification_status: "verified", verification_note: "SMS ile araç sahibi tarafından doğrulandı" })
          .eq("id", vehicleId);
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
