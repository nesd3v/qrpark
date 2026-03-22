import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limit
const ipRequests = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 2; // max 2 calls per IP per hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipRequests.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  ipRequests.set(ip, timestamps);
  return false;
}

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`;
  return `+${digits}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Çok fazla arama isteği gönderdiniz. Lütfen daha sonra tekrar deneyin." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { plate, caller_phone } = await req.json();

    if (!plate || !caller_phone) {
      return new Response(
        JSON.stringify({ error: "plate and caller_phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate caller_phone
    const normalizedCaller = normalizePhone(caller_phone);
    if (normalizedCaller.length < 10) {
      return new Response(
        JSON.stringify({ error: "Geçersiz telefon numarası" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("plate", plate)
      .maybeSingle();

    if (vehicleError || !vehicle) {
      return new Response(
        JSON.stringify({ error: "Araç bulunamadı" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vehicle.call_enabled) {
      return new Response(
        JSON.stringify({ error: "Bu araç sahibi arama bildirimlerini kapatmıştır." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Twilio to create a call connecting caller to vehicle owner via TwiML
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const twilioNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;
    const normalizedOwner = normalizePhone(vehicle.phone);

    // Create a call from Twilio to the caller, then connect to vehicle owner
    // This way both parties see the Twilio number, not each other's real numbers
    const twiml = `<Response><Say language="tr-TR">QRPark aracılığıyla araç sahibine bağlanıyorsunuz. Lütfen bekleyin.</Say><Dial callerId="${twilioNumber}">${normalizedOwner}</Dial></Response>`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      },
      body: new URLSearchParams({
        To: normalizedCaller,
        From: twilioNumber,
        Twiml: twiml,
      }),
    });

    const responseJson = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Twilio call error:", responseJson);
      return new Response(
        JSON.stringify({ error: "Arama başlatılamadı", detail: responseJson?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Call initiated:", responseJson?.sid);

    return new Response(
      JSON.stringify({ success: true, message: "Arama başlatıldı", call_sid: responseJson?.sid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
