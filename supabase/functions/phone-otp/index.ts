import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+90")) return `+${digits}`;
  if (digits.startsWith("90") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("5")) return `+90${digits}`;
  if (trimmed.startsWith("+")) return `+${digits}`;
  return `+90${digits}`;
}

function deriveEmail(phone: string): string {
  return `${phone.replace("+", "")}@phone.qrpark.app`;
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, phone, code, full_name, email } = body;

    if (!action || !phone) {
      return jsonResponse({ error: "action and phone are required" }, 400);
    }

    const normalizedPhone = normalizePhone(phone);
    const supabase = getSupabase();

    // ========== SEND OTP ==========
    if (action === "send") {
      const { data: recent } = await supabase
        .from("otp_codes")
        .select("created_at")
        .eq("phone", normalizedPhone)
        .neq("code", "VERIFIED")
        .gte("created_at", new Date(Date.now() - 30 * 1000).toISOString())
        .limit(1);

      if (recent && recent.length > 0) {
        return jsonResponse({ error: "Lütfen 30 saniye bekleyin" }, 429);
      }

      await supabase.from("otp_codes").delete().eq("phone", normalizedPhone);

      const otpCode = String(Math.floor(100000 + Math.random() * 900000));

      await supabase.from("otp_codes").insert({
        phone: normalizedPhone,
        code: otpCode,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const message = `QRPark dogrulama kodunuz: ${otpCode}. Bu kodu kimseyle paylasmayin.`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        },
        body: new URLSearchParams({ To: normalizedPhone, From: fromNumber, Body: message }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        console.error("Twilio OTP error:", errJson);
        return jsonResponse({ error: "SMS gönderilemedi" }, 500);
      }

      console.log("OTP sent to", normalizedPhone);
      return jsonResponse({ success: true, message: "Doğrulama kodu gönderildi" });
    }

    // ========== VERIFY OTP ==========
    if (action === "verify") {
      if (!code) return jsonResponse({ error: "code is required" }, 400);

      const { data: entry } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("phone", normalizedPhone)
        .neq("code", "VERIFIED")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!entry) {
        return jsonResponse({ error: "Doğrulama kodu bulunamadı veya süresi doldu" }, 400);
      }

      if (entry.attempts >= 5) {
        await supabase.from("otp_codes").delete().eq("id", entry.id);
        return jsonResponse({ error: "Çok fazla deneme. Lütfen yeni kod isteyin." }, 429);
      }

      await supabase.from("otp_codes").update({ attempts: entry.attempts + 1 }).eq("id", entry.id);

      if (entry.code !== code.trim()) {
        return jsonResponse({ error: "Yanlış doğrulama kodu", remaining: 4 - entry.attempts }, 400);
      }

      // OTP verified - delete old code
      await supabase.from("otp_codes").delete().eq("id", entry.id);

      // Check if user exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (profile) {
        // Existing user - get their email and generate magic link
        const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
        const userEmail = userData?.user?.email || deriveEmail(normalizedPhone);

        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: userEmail,
        });

        if (linkError) {
          console.error("Magic link error:", linkError);
          return jsonResponse({ error: "Giriş bağlantısı oluşturulamadı" }, 500);
        }

        return jsonResponse({
          verified: true,
          isNewUser: false,
          token_hash: linkData.properties.hashed_token,
          email: userEmail,
        });
      } else {
        // New user - store verification record for 10 minutes
        await supabase.from("otp_codes").insert({
          phone: normalizedPhone,
          code: "VERIFIED",
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });

        return jsonResponse({ verified: true, isNewUser: true });
      }
    }

    // ========== COMPLETE PROFILE (new user registration) ==========
    if (action === "complete-profile") {
      if (!full_name?.trim()) return jsonResponse({ error: "İsim gerekli" }, 400);

      // Check verification
      const { data: verifiedEntry } = await supabase
        .from("otp_codes")
        .select("id")
        .eq("phone", normalizedPhone)
        .eq("code", "VERIFIED")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!verifiedEntry) {
        return jsonResponse({ error: "Telefon doğrulaması bulunamadı. Lütfen tekrar deneyin." }, 400);
      }

      const userEmail = email?.trim() || deriveEmail(normalizedPhone);

      // Create user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        phone: normalizedPhone,
        phone_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          phone: normalizedPhone,
        },
      });

      if (createError) {
        console.error("Create user error:", createError);
        if (createError.message?.includes("already")) {
          return jsonResponse({ error: "Bu telefon veya e-posta zaten kayıtlı" }, 400);
        }
        return jsonResponse({ error: "Hesap oluşturulamadı" }, 500);
      }

      // Update profile with optional email
      if (email?.trim()) {
        await supabase.from("profiles")
          .update({ email: email.trim() })
          .eq("user_id", newUser.user.id);
      }

      // Clean up verification record
      await supabase.from("otp_codes").delete().eq("id", verifiedEntry.id);

      // Generate magic link for auto sign-in
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: userEmail,
      });

      if (linkError) {
        console.error("Magic link error after registration:", linkError);
        return jsonResponse({ error: "Hesap oluşturuldu ama giriş yapılamadı. Tekrar deneyin." }, 500);
      }

      return jsonResponse({
        success: true,
        token_hash: linkData.properties.hashed_token,
        email: userEmail,
      });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("OTP error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
