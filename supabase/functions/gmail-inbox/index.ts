import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

function gwHeaders() {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gmailKey = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY missing");
  if (!gmailKey) throw new Error("GOOGLE_MAIL_API_KEY missing");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": gmailKey,
    "Content-Type": "application/json",
  };
}

function decodeBase64Url(data: string): string {
  try {
    const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const bin = atob(b64 + pad);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

function extractBody(payload: any): { text: string; html: string } {
  let text = "";
  let html = "";
  const walk = (p: any) => {
    if (!p) return;
    if (p.mimeType === "text/plain" && p.body?.data) text += decodeBase64Url(p.body.data);
    else if (p.mimeType === "text/html" && p.body?.data) html += decodeBase64Url(p.body.data);
    if (Array.isArray(p.parts)) p.parts.forEach(walk);
  };
  walk(payload);
  if (!text && !html && payload?.body?.data) text = decodeBase64Url(payload.body.data);
  return { text, html };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: adminRole } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    if (action === "list") {
      const { query = "", maxResults = 25, pageToken = "", labelIds = "" } = params;
      const url = new URL(`${GATEWAY_URL}/users/me/messages`);
      url.searchParams.set("maxResults", String(maxResults));
      if (query) url.searchParams.set("q", query);
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      if (labelIds) labelIds.split(",").forEach((l: string) => url.searchParams.append("labelIds", l));

      const listRes = await fetch(url.toString(), { headers: gwHeaders() });
      if (!listRes.ok) {
        const txt = await listRes.text();
        return new Response(JSON.stringify({ error: `Gmail list failed [${listRes.status}]`, details: txt }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const listJson = await listRes.json();
      const ids: string[] = (listJson.messages || []).map((m: any) => m.id);

      const messages = await Promise.all(ids.map(async (id) => {
        const mUrl = new URL(`${GATEWAY_URL}/users/me/messages/${id}`);
        mUrl.searchParams.set("format", "metadata");
        ["From", "Subject", "Date", "To"].forEach((h) => mUrl.searchParams.append("metadataHeaders", h));
        const r = await fetch(mUrl.toString(), { headers: gwHeaders() });
        if (!r.ok) return null;
        const j = await r.json();
        const headers: any = {};
        (j.payload?.headers || []).forEach((h: any) => { headers[h.name] = h.value; });
        return {
          id: j.id,
          threadId: j.threadId,
          snippet: j.snippet,
          from: headers.From || "",
          to: headers.To || "",
          subject: headers.Subject || "(konu yok)",
          date: headers.Date || "",
          labelIds: j.labelIds || [],
          unread: (j.labelIds || []).includes("UNREAD"),
        };
      }));

      return new Response(JSON.stringify({
        messages: messages.filter(Boolean),
        nextPageToken: listJson.nextPageToken || null,
        resultSizeEstimate: listJson.resultSizeEstimate || 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "read") {
      const { id } = params;
      if (!id) return new Response(JSON.stringify({ error: "id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      const r = await fetch(`${GATEWAY_URL}/users/me/messages/${id}?format=full`, { headers: gwHeaders() });
      if (!r.ok) {
        const txt = await r.text();
        return new Response(JSON.stringify({ error: `Gmail read failed [${r.status}]`, details: txt }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const j = await r.json();
      const headers: any = {};
      (j.payload?.headers || []).forEach((h: any) => { headers[h.name] = h.value; });
      const { text, html } = extractBody(j.payload);
      return new Response(JSON.stringify({
        id: j.id, threadId: j.threadId, snippet: j.snippet, labelIds: j.labelIds || [],
        from: headers.From || "", to: headers.To || "", subject: headers.Subject || "",
        date: headers.Date || "", text, html,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "mark-read") {
      const { id } = params;
      const r = await fetch(`${GATEWAY_URL}/users/me/messages/${id}/modify`, {
        method: "POST", headers: gwHeaders(),
        body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
      });
      return new Response(JSON.stringify({ success: r.ok }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "mark-unread") {
      const { id } = params;
      const r = await fetch(`${GATEWAY_URL}/users/me/messages/${id}/modify`, {
        method: "POST", headers: gwHeaders(),
        body: JSON.stringify({ addLabelIds: ["UNREAD"] }),
      });
      return new Response(JSON.stringify({ success: r.ok }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "trash") {
      const { id } = params;
      const r = await fetch(`${GATEWAY_URL}/users/me/messages/${id}/trash`, {
        method: "POST", headers: gwHeaders(),
      });
      return new Response(JSON.stringify({ success: r.ok }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send") {
      const { to, subject, body, replyToMessageId, threadId } = params;
      if (!to || !subject || !body) {
        return new Response(JSON.stringify({ error: "to, subject, body required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let headers = [
        `To: ${to}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
      ];
      if (replyToMessageId) headers.push(`In-Reply-To: ${replyToMessageId}`, `References: ${replyToMessageId}`);
      const raw = headers.join("\r\n") + "\r\n\r\n" + body;
      const encoded = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const sendBody: any = { raw: encoded };
      if (threadId) sendBody.threadId = threadId;
      const r = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
        method: "POST", headers: gwHeaders(), body: JSON.stringify(sendBody),
      });
      const j = await r.json();
      if (!r.ok) {
        return new Response(JSON.stringify({ error: `Gmail send failed [${r.status}]`, details: j }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, id: j.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("gmail-inbox error:", err);
    const msg = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});