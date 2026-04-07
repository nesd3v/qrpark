import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { subscription_id } = await req.json();
    if (!subscription_id) return new Response(JSON.stringify({ error: "subscription_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Fetch subscription - user can only access their own
    const { data: sub, error: subError } = await supabaseUser
      .from("subscriptions")
      .select("*")
      .eq("id", subscription_id)
      .eq("user_id", user.id)
      .single();

    if (subError || !sub) return new Response(JSON.stringify({ error: "Subscription not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (sub.status !== "active") return new Response(JSON.stringify({ error: "Only active subscriptions have receipts" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const paymentDate = sub.payment_date ? new Date(sub.payment_date) : new Date(sub.created_at);
    const formattedDate = paymentDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    const receiptNo = `QRP-${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, "0")}${String(paymentDate.getDate()).padStart(2, "0")}-${sub.id.slice(0, 6).toUpperCase()}`;
    const planLabel = sub.plan_type === "yearly" ? "Premium Yıllık" : "Premium Aylık";
    const amountFormatted = `₺${(sub.amount / 100).toFixed(2)}`;
    const userEmail = escapeHtml(user.email || "—");
    const subStart = sub.subscription_start ? new Date(sub.subscription_start).toLocaleDateString("tr-TR") : "—";
    const subEnd = sub.subscription_end ? new Date(sub.subscription_end).toLocaleDateString("tr-TR") : "—";

    // Generate SVG-based receipt (returns as HTML for browser rendering / print-to-PDF)
    const receiptHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Makbuz - ${receiptNo}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; padding: 40px; }
  .receipt { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
  .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; padding: 32px; text-align: center; }
  .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .header p { font-size: 13px; opacity: 0.8; }
  .badge { display: inline-block; background: #6C63FF; color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 12px; }
  .body { padding: 32px; }
  .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #64748b; font-size: 14px; }
  .info-value { color: #1e293b; font-size: 14px; font-weight: 600; }
  .total-row { display: flex; justify-content: space-between; padding: 16px 0; margin-top: 8px; border-top: 2px solid #e2e8f0; }
  .total-label { color: #1e293b; font-size: 16px; font-weight: 700; }
  .total-value { color: #6C63FF; font-size: 20px; font-weight: 700; }
  .footer { text-align: center; padding: 20px 32px 28px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; }
  @media print { body { padding: 0; background: #fff; } .receipt { border: none; border-radius: 0; } }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <h1>QR Park</h1>
    <p>Ödeme Makbuzu</p>
    <div class="badge">ÖDEME TAMAMLANDI</div>
  </div>
  <div class="body">
    <div class="info-row">
      <span class="info-label">Makbuz No</span>
      <span class="info-value">${escapeHtml(receiptNo)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tarih</span>
      <span class="info-value">${escapeHtml(formattedDate)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">E-posta</span>
      <span class="info-value">${userEmail}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Plan</span>
      <span class="info-value">${escapeHtml(planLabel)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Dönem Başlangıcı</span>
      <span class="info-value">${escapeHtml(subStart)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Dönem Bitişi</span>
      <span class="info-value">${escapeHtml(subEnd)}</span>
    </div>
    <div class="total-row">
      <span class="total-label">Toplam Tutar</span>
      <span class="total-value">${escapeHtml(amountFormatted)}</span>
    </div>
  </div>
  <div class="footer">
    Bu belge bilgi amaçlıdır ve resmi fatura yerine geçmez.<br/>
    QR Park &copy; ${new Date().getFullYear()}
  </div>
</div>
</body>
</html>`;

    return new Response(receiptHtml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("Receipt error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
