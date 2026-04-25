import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check corporate membership
    const { data: membership } = await supabase
      .from("corporate_members")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) return json({ error: "No active corporate membership" }, 403);

    const body = await req.json();
    const { action } = body;

    // CHECK membership
    if (action === "check") {
      return json({ membership });
    }

    // LIST vehicles
    if (action === "vehicles") {
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id, plate, phone, verification_status, last_qr_generated_at, qr_expires_at, created_at")
        .eq("user_id", user.id)
        .eq("account_type", "corporate")
        .order("created_at", { ascending: false });
      return json({ vehicles: vehicles || [] });
    }

    // BULK IMPORT
    if (action === "bulk_import") {
      const rows: { plate: string; phone: string }[] = body.vehicles || [];
      if (!Array.isArray(rows) || rows.length === 0) return json({ error: "No vehicles provided" }, 400);
      if (rows.length > 500) return json({ error: "Tek seferde en fazla 500 araç eklenebilir" }, 400);

      const { count: existingCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("account_type", "corporate");

      if ((existingCount || 0) + rows.length > membership.max_vehicles) {
        return json({ error: `Araç limiti aşılıyor. Mevcut: ${existingCount}, Eklenecek: ${rows.length}, Limit: ${membership.max_vehicles}` }, 400);
      }

      const results = { added: 0, skipped: 0, errors: [] as string[] };
      for (const row of rows) {
        const plate = (row.plate || "").toUpperCase().trim();
        const phone = (row.phone || "").trim();
        if (!plate || !phone) { results.skipped++; continue; }
        const { error } = await supabase
          .from("vehicles")
          .upsert({ plate, phone, user_id: user.id, account_type: "corporate" }, { onConflict: "plate" });
        if (error) results.errors.push(`${plate}: ${error.message}`);
        else results.added++;
      }
      return json({ success: true, results });
    }

    // NOTIFICATIONS
    if (action === "notifications") {
      const { data: vehicles } = await supabase
        .from("vehicles").select("id").eq("user_id", user.id);
      const vehicleIds = (vehicles || []).map(v => v.id);
      if (vehicleIds.length === 0) return json({ notifications: [], stats: { byType: {}, byDay: {}, byVehicle: {}, total: 0 } });

      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: false })
        .limit(500);

      const notifs = notifications || [];
      const byType: Record<string, number> = {};
      const byDay: Record<string, number> = {};
      const byVehicle: Record<string, number> = {};
      for (const n of notifs) {
        byType[n.issue_type] = (byType[n.issue_type] || 0) + 1;
        byDay[n.created_at.slice(0, 10)] = (byDay[n.created_at.slice(0, 10)] || 0) + 1;
        byVehicle[n.plate] = (byVehicle[n.plate] || 0) + 1;
      }
      return json({ notifications: notifs, stats: { byType, byDay, byVehicle, total: notifs.length } });
    }

    // REPORT
    if (action === "report") {
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id, plate, phone, verification_status, last_qr_generated_at, qr_expires_at")
        .eq("user_id", user.id);
      const vList = vehicles || [];
      const vehicleIds = vList.map(v => v.id);
      const now = new Date();
      let notifCount = 0;
      if (vehicleIds.length > 0) {
        const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).in("vehicle_id", vehicleIds);
        notifCount = count || 0;
      }
      return json({
        report: {
          totalVehicles: vList.length,
          verified: vList.filter(v => v.verification_status === "verified").length,
          pending: vList.filter(v => v.verification_status === "pending").length,
          rejected: vList.filter(v => v.verification_status === "rejected").length,
          activeQr: vList.filter(v => !v.qr_expires_at || new Date(v.qr_expires_at) > now).length,
          expiredQr: vList.filter(v => v.qr_expires_at && new Date(v.qr_expires_at) <= now).length,
          totalNotifications: notifCount,
          maxVehicles: membership.max_vehicles,
        },
      });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("Corporate error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
