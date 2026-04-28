import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "destek@qrpark.xyz";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function sendViaGmail(subject: string, html: string, text: string, replyTo?: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gmailKey = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!lovableKey || !gmailKey) throw new Error("Gmail connector not configured");

  const headers = [
    `To: ${ADMIN_EMAIL}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="qrpark-bdry"`,
  ];
  if (replyTo) headers.push(`Reply-To: ${replyTo}`);

  const body =
    `--qrpark-bdry\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${text}\r\n` +
    `--qrpark-bdry\r\nContent-Type: text/html; charset="UTF-8"\r\n\r\n${html}\r\n` +
    `--qrpark-bdry--`;

  const raw = headers.join("\r\n") + "\r\n\r\n" + body;
  const encoded = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const r = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gmailKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encoded }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Gmail send failed [${r.status}]: ${t}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, payload } = await req.json();
    if (!type || !payload) {
      return new Response(JSON.stringify({ error: "type and payload required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject = "QRPark - Yeni Bildirim";
    let html = "";
    let text = "";
    let replyTo: string | undefined;

    if (type === "contact") {
      const { name, email, phone, message } = payload;
      subject = `[QRPark İletişim] ${name || "İsimsiz"}`;
      replyTo = email;
      text = `Yeni iletişim formu mesajı:\n\nAd: ${name}\nE-posta: ${email}\nTelefon: ${phone || "-"}\n\nMesaj:\n${message}`;
      html = `<div style="font-family:sans-serif;max-width:600px"><h2 style="color:#10B981">Yeni İletişim Mesajı</h2>
        <p><b>Ad:</b> ${escapeHtml(name)}</p>
        <p><b>E-posta:</b> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        <p><b>Telefon:</b> ${escapeHtml(phone || "-")}</p>
        <p><b>Mesaj:</b></p><div style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(message)}</div></div>`;
    } else if (type === "support") {
      const { user_name, user_email, message, conversation_id } = payload;
      subject = `[QRPark Destek] ${user_name || user_email || "Yeni mesaj"}`;
      replyTo = user_email;
      text = `Canlı destekten yeni mesaj:\n\nKullanıcı: ${user_name}\nE-posta: ${user_email}\nKonuşma: ${conversation_id}\n\nMesaj:\n${message}`;
      html = `<div style="font-family:sans-serif;max-width:600px"><h2 style="color:#10B981">Canlı Destek - Yeni Mesaj</h2>
        <p><b>Kullanıcı:</b> ${escapeHtml(user_name || "")}</p>
        <p><b>E-posta:</b> ${escapeHtml(user_email || "")}</p>
        <p><b>Mesaj:</b></p><div style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(message)}</div>
        <p style="margin-top:16px"><a href="https://qqrpark.lovable.app/admin" style="background:#10B981;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Admin Panelde Aç</a></p></div>`;
    } else if (type === "corporate") {
      const { company_name, contact_email, contact_phone, vehicle_count, plan_type, message } = payload;
      subject = `[QRPark Kurumsal] ${company_name}`;
      replyTo = contact_email;
      text = `Kurumsal başvuru:\n\nFirma: ${company_name}\nPlan: ${plan_type}\nAraç: ${vehicle_count}\nE-posta: ${contact_email}\nTelefon: ${contact_phone}\n\nMesaj:\n${message || "-"}`;
      html = `<div style="font-family:sans-serif;max-width:600px"><h2 style="color:#10B981">Yeni Kurumsal Başvuru</h2>
        <p><b>Firma:</b> ${escapeHtml(company_name)}</p>
        <p><b>Plan:</b> ${escapeHtml(plan_type)}</p>
        <p><b>Araç sayısı:</b> ${escapeHtml(String(vehicle_count))}</p>
        <p><b>E-posta:</b> ${escapeHtml(contact_email)}</p>
        <p><b>Telefon:</b> ${escapeHtml(contact_phone)}</p>
        <p><b>Mesaj:</b></p><div style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(message || "-")}</div></div>`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendViaGmail(subject, html, text, replyTo);

    // Log
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase.from("email_send_log").insert({
        recipient_email: ADMIN_EMAIL,
        template_name: `admin-${type}`,
        status: "sent",
        message_id: crypto.randomUUID(),
      });
    } catch (e) { console.error("log error", e); }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-admin-email error:", err);
    const msg = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});