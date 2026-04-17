import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PAYTR-CALLBACK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const formData = await req.text();
    const params = new URLSearchParams(formData);

    const merchantOid = params.get("merchant_oid") ?? "";
    const status = params.get("status") ?? "";
    const totalAmount = params.get("total_amount") ?? "";
    const hash = params.get("hash") ?? "";

    logStep("Callback received", { merchantOid, status, totalAmount, hashLen: hash.length });

    const merchantKey = Deno.env.get("PAYTR_MERCHANT_KEY") ?? "";
    const merchantSalt = Deno.env.get("PAYTR_MERCHANT_SALT") ?? "";

    const hashStr = `${merchantOid}${merchantSalt}${status}${totalAmount}`;
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(merchantKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(hashStr));
    const arr = new Uint8Array(signature);
    const computedHash = btoa(String.fromCharCode(...arr));

    if (computedHash !== hash) {
      logStep("Hash verification failed", { computedHash, receivedHash: hash });
      return new Response("PAYTR notification failed: bad hash", { status: 400, headers: corsHeaders });
    }

    logStep("Hash verified");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Look up the pending subscription FIRST (more reliable than parsing OID)
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("merchant_oid", merchantOid)
      .maybeSingle();

    if (fetchErr) logStep("Fetch existing error", { message: fetchErr.message });

    if (status === "success") {
      const now = new Date();
      const planType = existing?.plan_type ?? "monthly";
      const subscriptionEnd = new Date(now);
      if (planType === "yearly") subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
      else subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

      if (existing) {
        const { error: updErr } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            payment_date: now.toISOString(),
            subscription_start: now.toISOString(),
            subscription_end: subscriptionEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("merchant_oid", merchantOid);
        if (updErr) logStep("Update error", { message: updErr.message });
        logStep("Subscription activated (existing)", { userId: existing.user_id, planType });
      } else {
        // Fallback: parse user_id from OID (32 hex chars + timestamp)
        const sanitizedUuid = merchantOid.substring(0, 32);
        const userId = `${sanitizedUuid.slice(0, 8)}-${sanitizedUuid.slice(8, 12)}-${sanitizedUuid.slice(12, 16)}-${sanitizedUuid.slice(16, 20)}-${sanitizedUuid.slice(20)}`;
        const { error: insErr } = await supabaseAdmin.from("subscriptions").insert({
          user_id: userId,
          merchant_oid: merchantOid,
          plan_type: planType,
          amount: parseInt(totalAmount) || 0,
          status: "active",
          payment_date: now.toISOString(),
          subscription_start: now.toISOString(),
          subscription_end: subscriptionEnd.toISOString(),
        });
        if (insErr) logStep("Insert error", { message: insErr.message });
        logStep("Subscription activated (inserted)", { userId, planType });
      }
    } else {
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("merchant_oid", merchantOid);
      logStep("Payment failed", { merchantOid });
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    logStep("ERROR", { message: error instanceof Error ? error.message : String(error) });
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
