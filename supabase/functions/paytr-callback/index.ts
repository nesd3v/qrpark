import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYTR-CALLBACK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await req.text();
    const params = new URLSearchParams(formData);

    const merchantOid = params.get("merchant_oid") ?? "";
    const status = params.get("status") ?? "";
    const totalAmount = params.get("total_amount") ?? "";
    const hash = params.get("hash") ?? "";

    logStep("Callback received", { merchantOid, status, totalAmount });

    // Verify hash
    const merchantKey = Deno.env.get("PAYTR_MERCHANT_KEY") ?? "";
    const merchantSalt = Deno.env.get("PAYTR_MERCHANT_SALT") ?? "";

    const hashStr = `${merchantOid}${merchantSalt}${status}${totalAmount}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(merchantKey);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(hashStr));
    const arr = new Uint8Array(signature);
    const computedHash = btoa(String.fromCharCode(...arr));

    if (computedHash !== hash) {
      logStep("Hash verification failed", { computedHash, receivedHash: hash });
      return new Response("HASH_MISMATCH", { status: 400 });
    }

    logStep("Hash verified successfully");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const isSticker = merchantOid.startsWith("STK");

    if (isSticker) {
      // ===== STICKER PAYMENT =====
      if (status === "success") {
        // Extract user_id: STK + 32-char uuid + timestamp
        const sanitizedUuid = merchantOid.substring(3, 35);
        const userId = `${sanitizedUuid.slice(0,8)}-${sanitizedUuid.slice(8,12)}-${sanitizedUuid.slice(12,16)}-${sanitizedUuid.slice(16,20)}-${sanitizedUuid.slice(20)}`;

        // Update subscription record
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "completed", payment_date: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("merchant_oid", merchantOid);

        // Activate the most recent payment_pending sticker order for this user
        const { data: pendingOrders } = await supabaseAdmin
          .from("sticker_orders")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "payment_pending")
          .order("created_at", { ascending: false })
          .limit(1);

        if (pendingOrders && pendingOrders.length > 0) {
          await supabaseAdmin
            .from("sticker_orders")
            .update({ status: "pending", updated_at: new Date().toISOString() })
            .eq("id", pendingOrders[0].id);
          logStep("Sticker order activated", { orderId: pendingOrders[0].id, userId });
        }
      } else {
        // Payment failed - remove pending sticker order
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("merchant_oid", merchantOid);

        const sanitizedUuid = merchantOid.substring(3, 35);
        const userId = `${sanitizedUuid.slice(0,8)}-${sanitizedUuid.slice(8,12)}-${sanitizedUuid.slice(12,16)}-${sanitizedUuid.slice(16,20)}-${sanitizedUuid.slice(20)}`;

        await supabaseAdmin
          .from("sticker_orders")
          .delete()
          .eq("user_id", userId)
          .eq("status", "payment_pending");

        logStep("Sticker payment failed, order removed", { merchantOid });
      }
    } else {
      // ===== SUBSCRIPTION PAYMENT (existing logic) =====
      if (status === "success") {
        const sanitizedUuid = merchantOid.substring(0, 32);
        const userId = `${sanitizedUuid.slice(0,8)}-${sanitizedUuid.slice(8,12)}-${sanitizedUuid.slice(12,16)}-${sanitizedUuid.slice(16,20)}-${sanitizedUuid.slice(20)}`;

        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("merchant_oid", merchantOid)
          .single();

        const now = new Date();
        let subscriptionEnd: Date;
        const planType = existing?.plan_type ?? "monthly";

        if (planType === "yearly") {
          subscriptionEnd = new Date(now);
          subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
        } else {
          subscriptionEnd = new Date(now);
          subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
        }

        if (existing) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
              payment_date: now.toISOString(),
              subscription_start: now.toISOString(),
              subscription_end: subscriptionEnd.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("merchant_oid", merchantOid);
        } else {
          await supabaseAdmin
            .from("subscriptions")
            .insert({
              user_id: userId,
              merchant_oid: merchantOid,
              plan_type: planType,
              amount: parseInt(totalAmount) || 0,
              status: "active",
              payment_date: now.toISOString(),
              subscription_start: now.toISOString(),
              subscription_end: subscriptionEnd.toISOString(),
            });
        }

        logStep("Subscription activated", { userId, planType, subscriptionEnd: subscriptionEnd.toISOString() });
      } else {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("merchant_oid", merchantOid);

        logStep("Payment failed", { merchantOid });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response("OK", { status: 200 });
  }
});
