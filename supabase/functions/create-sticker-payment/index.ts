import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const userId = claimsData.claims.sub as string;
    const email = claimsData.claims.email as string;
    if (!userId) throw new Error("User not authenticated");

    const { vehicleId, plate, address, note } = await req.json();
    if (!vehicleId || !plate || !address?.trim()) {
      return new Response(JSON.stringify({ error: "vehicleId, plate ve address gerekli" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const merchantId = Deno.env.get("PAYTR_MERCHANT_ID") ?? "";
    const merchantKey = Deno.env.get("PAYTR_MERCHANT_KEY") ?? "";
    const merchantSalt = Deno.env.get("PAYTR_MERCHANT_SALT") ?? "";

    const sanitizedUserId = userId.replace(/-/g, "");
    const merchantOid = `STK${sanitizedUserId}${Date.now()}`;
    const paymentAmount = 4900; // 49.00 TL kuruş cinsinden
    const currency = "TL";
    const userIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "85.34.78.112";
    const origin = req.headers.get("origin") || "https://qrpark.xyz";
    const merchantOkUrl = `${origin}/generate?checkout=success`;
    const merchantFailUrl = `${origin}/generate?checkout=failed`;

    // Save pending sticker order with merchant_oid reference
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin.from("sticker_orders").insert({
      user_id: userId,
      vehicle_id: vehicleId,
      plate: plate.toUpperCase(),
      address: address.trim(),
      note: note?.trim() || null,
      status: "payment_pending",
    });

    // Also store in subscriptions table for PayTR callback to find
    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      merchant_oid: merchantOid,
      plan_type: "sticker",
      amount: paymentAmount,
      status: "pending",
    });

    const userEmail = email || `${userId}@qrpark.app`;
    const userName = userEmail.split("@")[0];
    const userAddress = address.trim();
    const userPhone = "05000000000";
    const userBasket = base64Encode(
      JSON.stringify([["QRPark Sticker", paymentAmount / 100, 1]])
    );
    const noInstallment = 1;
    const maxInstallment = 0;
    const testMode = 1;
    const debugOn = 1;
    const timeout = 30;
    const lang = "tr";

    const hashStr = `${merchantId}${userIp}${merchantOid}${userEmail}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;

    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(merchantKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(hashStr + merchantSalt));
    const paytrToken = base64Encode(new Uint8Array(signature));

    const formData = new URLSearchParams();
    formData.append("merchant_id", merchantId);
    formData.append("user_ip", userIp);
    formData.append("merchant_oid", merchantOid);
    formData.append("email", userEmail);
    formData.append("payment_amount", paymentAmount.toString());
    formData.append("paytr_token", paytrToken);
    formData.append("user_basket", userBasket);
    formData.append("debug_on", debugOn.toString());
    formData.append("no_installment", noInstallment.toString());
    formData.append("max_installment", maxInstallment.toString());
    formData.append("user_name", userName);
    formData.append("user_address", userAddress);
    formData.append("user_phone", userPhone);
    formData.append("merchant_ok_url", merchantOkUrl);
    formData.append("merchant_fail_url", merchantFailUrl);
    formData.append("timeout_limit", timeout.toString());
    formData.append("currency", currency);
    formData.append("test_mode", testMode.toString());
    formData.append("lang", lang);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const callbackUrl = `${supabaseUrl}/functions/v1/paytr-callback`;
    formData.append("merchant_notify_url", callbackUrl);

    const paytrResponse = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const paytrResult = await paytrResponse.json();

    if (paytrResult.status !== "success") {
      throw new Error(paytrResult.reason || "PayTR token alınamadı");
    }

    return new Response(JSON.stringify({ token: paytrResult.token, merchantOid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[STICKER-PAYMENT]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
