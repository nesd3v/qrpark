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

    const { action, vehicle_id, status: newStatus, note, user_email, max_vehicles, search, issue_type, date_from, date_to, page, order_id, codes, count, code_id } = await req.json();

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

    // CORPORATE APPROVE - Create corporate membership for a user
    if (action === "corporate_approve") {
      if (!vehicle_id || !user_email) {
        return new Response(JSON.stringify({ error: "inquiry id and user_email are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Get inquiry
      const { data: inquiry } = await supabase.from("corporate_inquiries").select("*").eq("id", vehicle_id).maybeSingle();
      if (!inquiry) {
        return new Response(JSON.stringify({ error: "Inquiry not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Find user by email
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const targetUser = (users || []).find(u => u.email === user_email.trim().toLowerCase());
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "User not found with this email" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Create corporate membership
      const { error: memberError } = await supabase.from("corporate_members").upsert({
        user_id: targetUser.id,
        inquiry_id: inquiry.id,
        company_name: inquiry.company_name,
        plan_type: inquiry.plan_type,
        max_vehicles: max_vehicles || inquiry.vehicle_count || 50,
        is_active: true,
      }, { onConflict: "user_id" });
      if (memberError) {
        return new Response(JSON.stringify({ error: "Failed to create membership: " + memberError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Update inquiry status
      await supabase.from("corporate_inquiries").update({ status: "completed", user_id: targetUser.id }).eq("id", vehicle_id);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // NOTIFICATIONS LIST
    if (action === "notifications_list") {
      const limit = 50;
      const offset = ((page || 1) - 1) * limit;
      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("plate", `%${search}%`);
      }
      if (issue_type && issue_type !== "all") {
        query = query.eq("issue_type", issue_type);
      }
      if (date_from) {
        query = query.gte("created_at", date_from);
      }
      if (date_to) {
        query = query.lte("created_at", date_to);
      }

      const { data: notifications, count, error: listError } = await query.range(offset, offset + limit - 1);

      if (listError) {
        return new Response(JSON.stringify({ error: "Failed to fetch notifications" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Get distinct issue types for filter
      const { data: types } = await supabase.from("notifications").select("issue_type");
      const uniqueTypes = [...new Set((types || []).map(t => t.issue_type))].sort();

      return new Response(JSON.stringify({ notifications: notifications || [], total: count || 0, issue_types: uniqueTypes }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // USERS LIST
    if (action === "users_list") {
      const limit = 50;
      const offset = ((page || 1) - 1) * limit;

      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data: profiles, count, error: profError } = await query.range(offset, offset + limit - 1);

      if (profError) {
        return new Response(JSON.stringify({ error: "Failed to fetch users" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Get subscriptions for these users
      const userIds = (profiles || []).map(p => p.user_id);
      let subscriptions: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("*")
          .in("user_id", userIds)
          .order("created_at", { ascending: false });
        if (subs) {
          for (const sub of subs) {
            if (!subscriptions[sub.user_id]) subscriptions[sub.user_id] = sub;
          }
        }
      }

      // Get vehicle counts
      let vehicleCounts: Record<string, number> = {};
      if (userIds.length > 0) {
        const { data: vehicles } = await supabase
          .from("vehicles")
          .select("user_id")
          .in("user_id", userIds);
        if (vehicles) {
          for (const v of vehicles) {
            if (v.user_id) vehicleCounts[v.user_id] = (vehicleCounts[v.user_id] || 0) + 1;
          }
        }
      }

      // Get user emails from auth
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const emailMap: Record<string, string> = {};
      for (const u of (authUsers || [])) {
        emailMap[u.id] = u.email || "";
      }

      const enriched = (profiles || []).map(p => ({
        ...p,
        email: emailMap[p.user_id] || "",
        subscription: subscriptions[p.user_id] || null,
        vehicle_count: vehicleCounts[p.user_id] || 0,
      }));

      return new Response(JSON.stringify({ users: enriched, total: count || 0 }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
