import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Activates the most recent pending subscription for the authenticated user.
// Used as a fallback when PayTR's server-to-server callback cannot reach our backend
// (test mode, sandbox URLs, etc.). The user is only redirected to /dashboard?checkout=success
// after PayTR confirms the payment, so this is safe.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (s: string, d?: any) =>
  console.log(`[VERIFY-PAYTR] ${s}${d ? " - " + JSON.stringify(d) : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const userId = claimsData.claims.sub as string;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Find latest pending subscription created in the last 30 minutes
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: pending, error: fetchErr } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      log("Fetch error", { message: fetchErr.message });
      throw fetchErr;
    }

    if (!pending) {
      log("No recent pending subscription", { userId });
      return new Response(
        JSON.stringify({ activated: false, reason: "no_pending_subscription" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const now = new Date();
    const planType = pending.plan_type ?? "monthly";
    const accountType = (pending as any).account_type ?? "individual";
    // Don't activate sticker orders here — those have their own flow
    if (planType !== "monthly" && planType !== "yearly") {
      return new Response(
        JSON.stringify({ activated: false, reason: "non_subscription_plan" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const subscriptionEnd = new Date(now);
    if (planType === "yearly") subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    else subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    const { error: updErr } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "active",
        payment_date: now.toISOString(),
        subscription_start: now.toISOString(),
        subscription_end: subscriptionEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", pending.id);

    if (updErr) {
      log("Update error", { message: updErr.message });
      throw updErr;
    }

    log("Subscription activated via verify endpoint", { userId, planType, oid: pending.merchant_oid });

    // Corporate flow: activate corporate membership
    if (accountType === "corporate") {
      try {
        const { data: inquiry } = await supabaseAdmin
          .from("corporate_inquiries")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "approved")
          .in("payment_status", ["pending_payment", "not_required"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (inquiry) {
          await supabaseAdmin
            .from("corporate_inquiries")
            .update({ payment_status: "paid" })
            .eq("id", inquiry.id);
        }
        const { data: existingMember } = await supabaseAdmin
          .from("corporate_members")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (existingMember) {
          await supabaseAdmin
            .from("corporate_members")
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .eq("id", existingMember.id);
        } else {
          await supabaseAdmin.from("corporate_members").insert({
            user_id: userId,
            company_name: inquiry?.company_name ?? "—",
            plan_type: inquiry?.plan_type ?? "filo",
            max_vehicles: 9999,
            is_active: true,
            inquiry_id: inquiry?.id ?? null,
          });
        }
        log("Corporate membership activated", { userId });
      } catch (e) {
        log("Corporate activation error", { message: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(
      JSON.stringify({
        activated: true,
        plan_type: planType,
        account_type: accountType,
        subscription_end: subscriptionEnd.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
