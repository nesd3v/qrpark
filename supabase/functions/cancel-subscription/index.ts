import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Parse desired action: "stop_renewal" (default, soft cancel — keeps access until end)
    // or "resume_renewal" to re-enable auto renewal.
    let action: "stop_renewal" | "resume_renewal" = "stop_renewal";
    try {
      const body = await req.json();
      if (body?.action === "resume_renewal") action = "resume_renewal";
    } catch {
      /* no body */
    }

    const update: Record<string, unknown> = {
      auto_renew: action === "resume_renewal",
      updated_at: new Date().toISOString(),
    };
    if (action === "stop_renewal") update.cancelled_at = new Date().toISOString();
    else update.cancelled_at = null;

    const { data, error } = await adminClient
      .from("subscriptions")
      .update(update)
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .select();

    if (error) throw error;

    console.log(
      `[CANCEL-SUBSCRIPTION] action=${action} affected=${data?.length ?? 0} user=${user.id}`
    );

    return new Response(
      JSON.stringify({ success: true, action, affected: data?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
