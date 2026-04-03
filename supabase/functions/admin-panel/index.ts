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
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role using service role client
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, vehicle_id, status: newStatus, note } = await req.json();

    // LIST pending verifications
    if (action === "list") {
      const statusFilter = newStatus || "pending";
      const { data: vehicles, error: listError } = await supabase
        .from("vehicles")
        .select("id, plate, phone, user_id, verification_status, ruhsat_photo_path, verification_note, created_at")
        .eq("verification_status", statusFilter)
        .order("created_at", { ascending: false })
        .limit(50);

      if (listError) {
        console.error("List error:", listError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch vehicles" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get profile names for each vehicle
      const userIds = [...new Set((vehicles || []).map(v => v.user_id).filter(Boolean))];
      let profiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        if (profileData) {
          profiles = Object.fromEntries(profileData.map(p => [p.user_id, p.full_name || ""]));
        }
      }

      // Generate signed URLs for ruhsat photos
      const vehiclesWithUrls = await Promise.all((vehicles || []).map(async (v) => {
        let photoUrl = null;
        if (v.ruhsat_photo_path) {
          const { data: signedData } = await supabase.storage
            .from("ruhsat-photos")
            .createSignedUrl(v.ruhsat_photo_path, 3600); // 1 hour
          photoUrl = signedData?.signedUrl || null;
        }
        return {
          ...v,
          photo_url: photoUrl,
          owner_name: profiles[v.user_id] || "Bilinmiyor",
        };
      }));

      return new Response(
        JSON.stringify({ vehicles: vehiclesWithUrls }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // UPDATE verification status
    if (action === "update") {
      if (!vehicle_id || !newStatus) {
        return new Response(
          JSON.stringify({ error: "vehicle_id and status are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!["verified", "rejected", "pending"].includes(newStatus)) {
        return new Response(
          JSON.stringify({ error: "Invalid status" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabase
        .from("vehicles")
        .update({
          verification_status: newStatus,
          verification_note: note || (newStatus === "verified" ? "Admin tarafından onaylandı" : "Admin tarafından reddedildi"),
        })
        .eq("id", vehicle_id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STATS
    if (action === "stats") {
      const { count: pending } = await supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("verification_status", "pending");
      const { count: verified } = await supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("verification_status", "verified");
      const { count: rejected } = await supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("verification_status", "rejected");
      const { count: totalNotifs } = await supabase.from("notifications").select("*", { count: "exact", head: true });
      const { count: corporateNew } = await supabase.from("corporate_inquiries").select("*", { count: "exact", head: true }).eq("status", "new");

      return new Response(
        JSON.stringify({ pending: pending || 0, verified: verified || 0, rejected: rejected || 0, total_notifications: totalNotifs || 0, corporate_new: corporateNew || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CORPORATE INQUIRIES - LIST
    if (action === "corporate_list") {
      const statusFilter = newStatus || "all";
      let query = supabase
        .from("corporate_inquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data: inquiries, error: listError } = await query;
      if (listError) {
        return new Response(JSON.stringify({ error: "Failed to fetch inquiries" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ inquiries: inquiries || [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // CORPORATE INQUIRIES - UPDATE STATUS
    if (action === "corporate_update") {
      if (!vehicle_id || !newStatus) {
        return new Response(JSON.stringify({ error: "id and status are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!["new", "reviewing", "completed"].includes(newStatus)) {
        return new Response(JSON.stringify({ error: "Invalid status" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error: updateError } = await supabase
        .from("corporate_inquiries")
        .update({ status: newStatus })
        .eq("id", vehicle_id);
      if (updateError) {
        return new Response(JSON.stringify({ error: "Failed to update" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // CHECK ADMIN (for frontend auth check)
    if (action === "check") {
      return new Response(
        JSON.stringify({ is_admin: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Admin error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
