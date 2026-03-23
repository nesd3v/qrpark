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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

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

    const { vehicle_id, photo_path, plate, full_name } = await req.json();

    if (!vehicle_id || !photo_path || !plate || !full_name) {
      return new Response(
        JSON.stringify({ error: "vehicle_id, photo_path, plate, and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify vehicle belongs to user
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, plate, user_id")
      .eq("id", vehicle_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!vehicle) {
      return new Response(
        JSON.stringify({ error: "Vehicle not found or not owned by user" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download photo
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("ruhsat-photos")
      .download(photo_path);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Could not download ruhsat photo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    const mimeType = fileData.type || "image/jpeg";

    // AI: extract plate AND name from ruhsat
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Sen bir Türk araç ruhsat belgesi (trafik tescil belgesi) doğrulama ve sahtecilik tespit uzmanısın. Fotoğrafı çok dikkatli incele.

Görevin:
1. Fotoğrafın gerçek bir Türk araç ruhsat belgesi olup olmadığını belirle.
2. SAHTECİLİK KONTROLÜ yap. Aşağıdaki belirtileri ara:
   - Yapay zeka (AI) tarafından üretilmiş görüntü belirtileri (düzgün olmayan yazı tipleri, tutarsız ışıklandırma, bulanık veya yamuk hologram/filigran, doğal olmayan kağıt dokusu, mükemmel simetri, pürüzsüz kenarlar)
   - Photoshop veya dijital düzenleme izleri (piksel tutarsızlıkları, farklı çözünürlük bölgeleri, kopyala-yapıştır izleri, renk uyumsuzluğu)
   - Gerçek ruhsat belgelerinde OLMASI GEREKEN öğelerin eksikliği: T.C. ibaresi, güvenlik hologramı, resmi mühür/damga, seri numarası, belge tarihi, barkod
   - Yazı tipinin resmi belge yazı tipiyle uyumsuzluğu
   - Belgenin bir ekran görüntüsü veya dijital kopyası olması (ekrandan çekilmiş fotoğraf kabul edilmez, orijinal belge fotoğrafı olmalı)
3. Belgede yazan PLAKA NUMARASINI oku ve temizle (boşlukları kaldır, büyük harfe çevir).
4. Belgede yazan ARAÇ SAHİBİNİN ADI SOYADINI oku.

ÖNEMLİ: Sahte belge tespitinde şüphe durumunda HER ZAMAN sahte olarak işaretle. Güvenlik önceliklidir.

SADECE aşağıdaki JSON formatında yanıt ver:
{"is_ruhsat": true/false, "is_fake": true/false, "fake_reason": "sahtecilik tespit edildiyse nedeni veya null", "detected_plate": "PLAKA veya null", "detected_name": "AD SOYAD veya null", "confidence": "high/medium/low", "reason": "kısa açıklama"}`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
              {
                type: "text",
                text: `Bu ruhsat belgesini incele. Plaka numarasını ve araç sahibinin adı soyadını tespit et.\nKarşılaştırılacak plaka: ${plate}\nKarşılaştırılacak isim: ${full_name}`,
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI servisi meşgul, lütfen tekrar deneyin" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI servisi kullanım limiti aşıldı" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fallback to admin review
      await supabase
        .from("vehicles")
        .update({
          verification_status: "pending",
          ruhsat_photo_path: photo_path,
          verification_note: "AI doğrulama başarısız, admin incelemesi bekleniyor",
        })
        .eq("id", vehicle_id);

      return new Response(
        JSON.stringify({ status: "pending", message: "Ruhsat fotoğrafınız admin tarafından incelenecek" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let parsed: {
      is_ruhsat: boolean;
      is_fake: boolean;
      fake_reason: string | null;
      detected_plate: string | null;
      detected_name: string | null;
      confidence: string;
      reason: string;
    };

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] || content);
    } catch {
      console.error("Failed to parse AI response:", content);
      await supabase
        .from("vehicles")
        .update({
          verification_status: "pending",
          ruhsat_photo_path: photo_path,
          verification_note: "AI yanıtı ayrıştırılamadı, admin incelemesi bekleniyor",
        })
        .eq("id", vehicle_id);

      return new Response(
        JSON.stringify({ status: "pending", message: "Ruhsat fotoğrafınız admin tarafından incelenecek" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize for comparison
    const normalizePlate = (p: string) => p.replace(/[\s\-]/g, "").toUpperCase();
    const normalizeName = (n: string) =>
      n.toUpperCase()
        .replace(/İ/g, "I")
        .replace(/Ğ/g, "G")
        .replace(/Ü/g, "U")
        .replace(/Ş/g, "S")
        .replace(/Ö/g, "O")
        .replace(/Ç/g, "C")
        .trim();

    const inputPlate = normalizePlate(plate);
    const detectedPlate = parsed.detected_plate ? normalizePlate(parsed.detected_plate) : null;
    const inputName = normalizeName(full_name);
    const detectedName = parsed.detected_name ? normalizeName(parsed.detected_name) : null;

    const plateMatch = detectedPlate === inputPlate;
    const nameMatch = detectedName ? detectedName.includes(inputName) || inputName.includes(detectedName) : false;

    let verificationStatus: string;
    let verificationNote: string;

    if (parsed.is_fake) {
      verificationStatus = "pending";
      verificationNote = `[AI Red] Sahte veya yapay zeka ile oluşturulmuş belge şüphesi: ${parsed.fake_reason || "Detay yok"} — Admin incelemesi bekleniyor`;
    } else if (!parsed.is_ruhsat) {
      verificationStatus = "pending";
      verificationNote = "[AI Red] Yüklenen belge geçerli bir araç ruhsatı olarak tanınamadı — Admin incelemesi bekleniyor";
    } else if (!detectedPlate) {
      verificationStatus = "pending";
      verificationNote = "Ruhsattan plaka okunamadı, admin incelemesi bekleniyor";
    } else if (plateMatch && nameMatch && parsed.confidence === "high") {
      verificationStatus = "verified";
      verificationNote = `Doğrulandı — Plaka: ${parsed.detected_plate}, İsim: ${parsed.detected_name}`;
    } else if (plateMatch && nameMatch) {
      verificationStatus = "pending";
      verificationNote = `Plaka ve isim eşleşiyor ancak güven düzeyi düşük (${parsed.confidence}), admin onayı bekleniyor`;
    } else if (plateMatch && !nameMatch) {
      verificationStatus = "pending";
      verificationNote = `[AI Red] Plaka eşleşiyor ancak isim uyuşmuyor. Girilen: ${full_name}, Tespit edilen: ${parsed.detected_name || "okunamadı"} — Admin incelemesi bekleniyor`;
    } else if (!plateMatch && nameMatch) {
      verificationStatus = "pending";
      verificationNote = `[AI Red] İsim eşleşiyor ancak plaka uyuşmuyor. Girilen: ${plate}, Tespit edilen: ${parsed.detected_plate || "okunamadı"} — Admin incelemesi bekleniyor`;
    } else {
      verificationStatus = "pending";
      verificationNote = `[AI Red] Plaka ve isim uyuşmuyor. Girilen plaka: ${plate}, Tespit edilen: ${parsed.detected_plate || "okunamadı"}. Girilen isim: ${full_name}, Tespit edilen: ${parsed.detected_name || "okunamadı"} — Admin incelemesi bekleniyor`;
    }

    await supabase
      .from("vehicles")
      .update({
        verification_status: verificationStatus,
        ruhsat_photo_path: photo_path,
        verification_note: verificationNote,
      })
      .eq("id", vehicle_id);

    return new Response(
      JSON.stringify({
        status: verificationStatus,
        message:
          verificationStatus === "verified"
            ? "Aracınız başarıyla doğrulandı!"
            : verificationStatus === "pending"
            ? "Ruhsat fotoğrafınız admin tarafından incelenecek"
            : verificationNote,
        detected_plate: parsed.detected_plate,
        detected_name: parsed.detected_name,
        plate_match: plateMatch,
        name_match: nameMatch,
        confidence: parsed.confidence,
      }),
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
