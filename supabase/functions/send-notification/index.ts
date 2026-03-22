import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type TwilioResult = {
  success: boolean;
  error?: string;
  sid?: string;
  status?: string;
};

const FAILED_STATUSES = new Set(["failed", "undelivered", "canceled"]);

// In-memory rate limit store (per isolate lifetime, ~minutes)
const ipRequests = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // max 3 per IP per hour

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

async function fetchTwilioStatus(accountSid: string, authToken: string, sid: string): Promise<string | null> {
  const statusUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${sid}.json`;
  const statusRes = await fetch(statusUrl, {
    method: "GET",
    headers: { Authorization: "Basic " + btoa(`${accountSid}:${authToken}`) },
  });
  if (!statusRes.ok) return null;
  const statusJson = await statusRes.json();
  return typeof statusJson?.status === "string" ? statusJson.status : null;
}

async function sendTwilioSMS(to: string, body: string): Promise<TwilioResult> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;
  const normalizedTo = normalizePhone(to);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
    },
    body: new URLSearchParams({ To: normalizedTo, From: fromNumber, Body: body }),
  });

  const responseJson = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMessage = responseJson?.message || "Twilio API error";
    const code = responseJson?.code ? ` (code: ${responseJson.code})` : "";
    const error = `${errorMessage}${code}`;
    console.error("Twilio error:", error);
    return { success: false, error };
  }

  const sid = responseJson?.sid as string | undefined;
  let status = (responseJson?.status as string | undefined) ?? "queued";
  console.log("Twilio accepted message", { sid, status, to: normalizedTo });

  if (sid) {
    await new Promise((resolve) => setTimeout(resolve, 1800));
    const latestStatus = await fetchTwilioStatus(accountSid, authToken, sid);
    if (latestStatus) status = latestStatus;
    console.log("Twilio latest status", { sid, status });
  }

  if (FAILED_STATUSES.has(status)) {
    return { success: false, error: `Twilio delivery failed: ${status}`, sid, status };
  }

  return { success: true, sid, status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit by IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Cok fazla istek gonderdiniz. Lutfen daha sonra tekrar deneyin." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { plate, issue_type, note } = await req.json();

    if (!plate || !issue_type) {
      return new Response(
        JSON.stringify({ error: "plate and issue_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate issue_type
    const validIssueTypes = ["wrong-park", "lights-on", "damaged", "window-open", "other"];
    if (!validIssueTypes.includes(issue_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid issue type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate note length
    if (note && typeof note === "string" && note.length > 500) {
      return new Response(
        JSON.stringify({ error: "Note too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Plate cooldown: check if a notification was sent for this plate in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentNotifs } = await supabase
      .from("notifications")
      .select("id")
      .eq("plate", plate)
      .gte("created_at", fiveMinAgo)
      .limit(1);

    if (recentNotifs && recentNotifs.length > 0) {
      return new Response(
        JSON.stringify({ error: "Bu plakaya kisa sure once bildirim gonderildi. Lutfen 5 dakika bekleyin." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("plate", plate)
      .maybeSingle();

    if (vehicleError) {
      console.error("Vehicle lookup error:", vehicleError);
      return new Response(
        JSON.stringify({ error: "Failed to look up vehicle" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vehicle) {
      return new Response(
        JSON.stringify({ error: "Vehicle not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if SMS is enabled for this vehicle
    if (!vehicle.sms_enabled) {
      return new Response(
        JSON.stringify({ error: "Bu araç sahibi SMS bildirimlerini kapatmıştır." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const issueLabels: Record<string, string> = {
      "wrong-park": "Hatali Park",
      "lights-on": "Farlar Acik",
      "damaged": "Arac Hasarli",
      "window-open": "Cam Acik",
      "other": "Diger",
    };

    const message = `QRPark Bildirimi\n\nPlaka: ${vehicle.plate}\nSorun: ${issueLabels[issue_type] || issue_type}${note ? `\nNot: ${note}` : ""}`;

    const smsResult = await sendTwilioSMS(vehicle.phone, message);
    const status = smsResult.success ? "sent" : "failed";

    const { error: notifError } = await supabase.from("notifications").insert({
      vehicle_id: vehicle.id,
      plate: vehicle.plate,
      issue_type,
      note: note || null,
      status,
    });

    if (notifError) {
      console.error("Notification insert error:", notifError);
    }

    if (!smsResult.success) {
      return new Response(
        JSON.stringify({ error: "SMS gonderilemedi", detail: smsResult.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "SMS queued", twilio_status: smsResult.status, twilio_sid: smsResult.sid }),
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
