import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

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
    if (!userId) throw new Error("User not authenticated");
    logStep("User authenticated", { userId });

    // Check local subscriptions table for active PayTR subscriptions (both account types)
    const { data: subs, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("subscription_end", new Date().toISOString())
      .order("subscription_end", { ascending: false });

    if (subError) {
      logStep("DB error", { message: subError.message });
      throw subError;
    }

    const individual = (subs ?? []).find((s: any) => (s.account_type ?? "individual") === "individual") ?? null;
    const corporate = (subs ?? []).find((s: any) => s.account_type === "corporate") ?? null;

    // Also check for legacy/grandfathered active corporate_members (no payment required)
    let corporateActive = !!corporate;
    if (!corporateActive) {
      const { data: member } = await supabaseClient
        .from("corporate_members")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      corporateActive = !!member;
    }

    const hasActiveSub = !!individual || corporateActive;
    logStep("Subscription check result", {
      individual: !!individual,
      corporate: corporateActive,
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      // Legacy fields (for back-compat) — prioritise individual
      plan_type: individual?.plan_type ?? corporate?.plan_type ?? null,
      subscription_end: individual?.subscription_end ?? corporate?.subscription_end ?? null,
      // New fields
      individual: individual ? {
        plan_type: individual.plan_type,
        subscription_end: individual.subscription_end,
      } : null,
      corporate: corporateActive ? {
        plan_type: corporate?.plan_type ?? "filo",
        subscription_end: corporate?.subscription_end ?? null,
        legacy: !corporate, // grandfathered member
      } : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
