import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function hmacSha256(key: string, data: string): string {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(data);
  
  // Use Web Crypto API
  return "";  // Will be replaced by async version below
}

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
    if (!email || !userId) throw new Error("User not authenticated");

    const { planType, accountType, billing } = await req.json();
    if (!planType || !["monthly", "yearly"].includes(planType)) {
      throw new Error("Invalid plan type");
    }
    const acctType = accountType === "corporate" ? "corporate" : "individual";

    const merchantId = Deno.env.get("PAYTR_MERCHANT_ID") ?? "";
    const merchantKey = Deno.env.get("PAYTR_MERCHANT_KEY") ?? "";
    const merchantSalt = Deno.env.get("PAYTR_MERCHANT_SALT") ?? "";

    const sanitizedUserId = userId.replace(/-/g, "");
    const merchantOid = `${sanitizedUserId}${Date.now()}`;
    // Pricing in kuruş (1 TL = 100 kuruş)
    const PRICES: Record<string, Record<string, number>> = {
      individual: { monthly: 35000, yearly: 349000 },   // ₺350 / ₺3.490
      corporate:  { monthly: 50000, yearly: 499000 },   // ₺500 / ₺4.990
    };
    const paymentAmount = PRICES[acctType][planType];
    const currency = "TL";
    const userIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "85.34.78.112";
    const successPath = acctType === "corporate" ? "/corporate-dashboard" : "/dashboard";
    const merchantOkUrl = `${req.headers.get("origin")}${successPath}?checkout=success`;
    const merchantFailUrl = `${req.headers.get("origin")}/pricing?checkout=failed`;

    // Save pending subscription record
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const billingType = billing?.billing_type === "corporate" ? "corporate" : "individual";
    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      merchant_oid: merchantOid,
      plan_type: planType,
      account_type: acctType,
      amount: paymentAmount,
      status: "pending",
      billing_type: billingType,
      billing_name: billing?.billing_name ?? null,
      billing_tckn: billing?.billing_tckn ?? null,
      billing_company: billing?.billing_company ?? null,
      billing_vkn: billing?.billing_vkn ?? null,
      billing_tax_office: billing?.billing_tax_office ?? null,
      billing_address: billing?.billing_address ?? null,
      billing_city: billing?.billing_city ?? null,
      billing_email: billing?.billing_email ?? email,
    });
    const userName =
      billing?.billing_company ||
      billing?.billing_name ||
      email.split("@")[0];
    const userAddress =
      [billing?.billing_address, billing?.billing_city].filter(Boolean).join(", ") ||
      "Türkiye";
    const userPhone = "05000000000";
    const planLabel = `QRPark ${acctType === "corporate" ? "Kurumsal" : "Bireysel"} Premium ${planType === "monthly" ? "Aylık" : "Yıllık"}`;
    const userBasket = base64Encode(
      JSON.stringify([[planLabel, paymentAmount / 100, 1]])
    );
    const noInstallment = 1;
    const maxInstallment = 0;
    const testMode = 1;
    const debugOn = 1;
    const timeout = 30;
    const lang = "tr";

    // Create HMAC token - PayTR format: HMAC(key=merchantKey, data=hashStr+merchantSalt)
    const hashStr = `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;
    
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

    // Request iFrame token from PayTR
    const formData = new URLSearchParams();
    formData.append("merchant_id", merchantId);
    formData.append("user_ip", userIp);
    formData.append("merchant_oid", merchantOid);
    formData.append("email", email);
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

    // PayTR callback URL - PayTR will POST payment result here
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

    return new Response(JSON.stringify({ token: paytrResult.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
