import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`;
  return `+${digits}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find vehicles whose QR expires within the next 24 hours
    // and haven't been notified yet (qr_expires_at is between now and now+24h)
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: expiringVehicles, error } = await supabase
      .from("vehicles")
      .select("id, plate, phone, user_id, qr_expires_at")
      .not("qr_expires_at", "is", null)
      .gte("qr_expires_at", now.toISOString())
      .lte("qr_expires_at", in24h.toISOString());

    if (error) {
      console.error("Query error:", error);
      throw error;
    }

    console.log(`Found ${expiringVehicles?.length || 0} vehicles with expiring QR codes`);

    let sentCount = 0;

    for (const vehicle of expiringVehicles || []) {
      try {
        // Send SMS reminder
        const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
        const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
        const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;
        const normalizedTo = normalizePhone(vehicle.phone);

        const smsBody = `QRPark Hatirlatma: ${vehicle.plate} plakali aracinizin QR kodunun suresi yarin doluyor. QR kodunuzu yenilemek icin uygulamaya giris yapin veya Premium'a gecerek suresiz QR kodu elde edin.`;

        const smsUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        await fetch(smsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
          },
          body: new URLSearchParams({ To: normalizedTo, From: fromNumber, Body: smsBody }),
        });

        // Send email reminder if user has an account
        if (vehicle.user_id) {
          const { data: userData } = await supabase.auth.admin.getUserById(vehicle.user_id);
          const ownerEmail = userData?.user?.email;
          if (ownerEmail) {
            await supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "qr-expiry-reminder",
                recipientEmail: ownerEmail,
                idempotencyKey: `qr-expiry-${vehicle.id}-${vehicle.qr_expires_at}`,
                templateData: {
                  plate: vehicle.plate,
                  expiryDate: new Date(vehicle.qr_expires_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              },
            });
          }
        }

        sentCount++;
      } catch (vehicleErr) {
        console.error(`Error processing vehicle ${vehicle.id}:`, vehicleErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: expiringVehicles?.length || 0, sent: sentCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
