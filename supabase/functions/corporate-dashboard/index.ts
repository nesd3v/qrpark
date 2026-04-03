import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check corporate membership
    const { data: membership } = await supabase
      .from("corporate_members")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) {
      return new Response(JSON.stringify({ error: "No active corporate membership" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action } = await req.json();

    // CHECK membership
    if (action === "check") {
      return new Response(JSON.stringify({ membership }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // LIST vehicles for this corporate user
    if (action === "vehicles") {
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id, plate, phone, verification_status, last_qr_generated_at, qr_expires_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return new Response(JSON.stringify({ vehicles: vehicles || [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // BULK IMPORT vehicles from CSV data
    if (action === "bulk_import") {
      const { vehicles: importData } = await req.json().catch(() => ({ vehicles: [] }));
      // importData already parsed from req above, re-parse body
      const body = JSON.parse(await new Response(req.body).text().catch(() => "{}"));
      // Actually we already consumed the body. Let's handle differently.
      return new Response(JSON.stringify({ error: "Use bulk_import_data action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "bulk_import_data") {
      const body = await req.json().catch(() => ({}));
      const rows: { plate: string; phone: string }[] = body.vehicles || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        return new Response(JSON.stringify({ error: "No vehicles provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check vehicle limit
      const { count: existingCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((existingCount || 0) + rows.length > membership.max_vehicles) {
        return new Response(JSON.stringify({ error: `Araç limiti aşılıyor. Mevcut: ${existingCount}, Eklenecek: ${rows.length}, Limit: ${membership.max_vehicles}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const results = { added: 0, skipped: 0, errors: [] as string[] };
      for (const row of rows) {
        const plate = (row.plate || "").toUpperCase().trim();
        const phone = (row.phone || "").trim();
        if (!plate || !phone) { results.skipped++; continue; }

        const { error } = await supabase
          .from("vehicles")
          .upsert({ plate, phone, user_id: user.id }, { onConflict: "plate" });
        if (error) {
          results.errors.push(`${plate}: ${error.message}`);
        } else {
          results.added++;
        }
      }
      return new Response(JSON.stringify({ success: true, results }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // NOTIFICATIONS for corporate user's vehicles
    if (action === "notifications") {
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id")
        .eq("user_id", user.id);
      const vehicleIds = (vehicles || []).map(v => v.id);
      if (vehicleIds.length === 0) {
        return new Response(JSON.stringify({ notifications: [], stats: {} }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: false })
        .limit(200);

      // Build stats
      const notifs = notifications || [];
      const byType: Record<string, number> = {};
      const byDay: Record<string, number> = {};
      const byVehicle: Record<string, number> = {};

      for (const n of notifs) {
        byType[n.issue_type] = (byType[n.issue_type] || 0) + 1;
        const day = n.created_at.slice(0, 10);
        byDay[day] = (byDay[day] || 0) + 1;
        byVehicle[n.plate] = (byVehicle[n.plate] || 0) + 1;
      }

      return new Response(JSON.stringify({
        notifications: notifs,
        stats: { byType, byDay, byVehicle, total: notifs.length },
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // REPORT - full stats
    if (action === "report") {
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id, plate, phone, verification_status, last_qr_generated_at, qr_expires_at")
        .eq("user_id", user.id);

      const vList = vehicles || [];
      const vehicleIds = vList.map(v => v.id);

      const verified = vList.filter(v => v.verification_status === "verified").length;
      const pending = vList.filter(v => v.verification_status === "pending").length;
      const rejected = vList.filter(v => v.verification_status === "rejected").length;
      const activeQr = vList.filter(v => v.qr_expires_at === null || new Date(v.qr_expires_at) > new Date()).length;
      const expiredQr = vList.filter(v => v.qr_expires_at && new Date(v.qr_expires_at) <= new Date()).length;

      let notifCount = 0;
      if (vehicleIds.length > 0) {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .in("vehicle_id", vehicleIds);
        notifCount = count || 0;
      }

      return new Response(JSON.stringify({
        report: {
          totalVehicles: vList.length,
          verified, pending, rejected,
          activeQr, expiredQr,
          totalNotifications: notifCount,
          maxVehicles: membership.max_vehicles,
        },
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Corporate error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
