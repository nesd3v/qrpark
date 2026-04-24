/**
 * Translates common backend / Supabase / network error messages into Turkish.
 * Usage: toast.error(translateError(err, "Varsayılan mesaj"))
 */

const ERROR_MAP: Array<{ match: RegExp; tr: string }> = [
  // Auth
  { match: /invalid login credentials/i, tr: "E-posta veya şifre hatalı" },
  { match: /invalid email or password/i, tr: "E-posta veya şifre hatalı" },
  { match: /email not confirmed/i, tr: "E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin." },
  { match: /user already registered/i, tr: "Bu e-posta adresi zaten kayıtlı" },
  { match: /user not found/i, tr: "Kullanıcı bulunamadı" },
  { match: /email already (in use|exists|registered)/i, tr: "Bu e-posta adresi zaten kayıtlı" },
  { match: /password should be at least (\d+)/i, tr: "Şifre en az 6 karakter olmalı" },
  { match: /weak password/i, tr: "Şifre çok zayıf" },
  { match: /password.*pwned|password.*compromised|password.*leaked/i, tr: "Bu şifre güvenlik ihlallerinde tespit edilmiş. Lütfen başka bir şifre seçin." },
  { match: /signup.*disabled|signups.*disabled/i, tr: "Yeni kayıtlar şu anda kapalı" },
  { match: /invalid email/i, tr: "Geçersiz e-posta adresi" },
  { match: /unable to validate email/i, tr: "E-posta adresi doğrulanamadı" },
  { match: /token has expired|otp.*expired|jwt.*expired/i, tr: "Doğrulama süresi doldu. Lütfen tekrar deneyin." },
  { match: /invalid token|invalid otp|otp.*invalid/i, tr: "Geçersiz doğrulama kodu" },
  { match: /too many requests|rate limit/i, tr: "Çok fazla istek gönderdiniz. Lütfen biraz bekleyin." },
  { match: /email rate limit exceeded/i, tr: "Çok fazla e-posta gönderildi. Lütfen birkaç dakika sonra tekrar deneyin." },
  { match: /new password should be different/i, tr: "Yeni şifre eskisinden farklı olmalı" },
  { match: /same.*password|password.*same/i, tr: "Yeni şifre eskisinden farklı olmalı" },
  { match: /session.*expired|session.*not found|auth session missing/i, tr: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın." },
  { match: /not authenticated|unauthorized|unauthenticated/i, tr: "Lütfen önce giriş yapın" },
  { match: /forbidden|access denied|permission denied/i, tr: "Bu işlem için yetkiniz yok" },

  // Database / RLS
  { match: /duplicate key|already exists|unique constraint/i, tr: "Bu kayıt zaten mevcut" },
  { match: /violates row-level security|rls/i, tr: "Bu işlem için yetkiniz yok" },
  { match: /violates foreign key/i, tr: "İlişkili kayıt bulunamadı" },
  { match: /violates not-null/i, tr: "Lütfen tüm zorunlu alanları doldurun" },
  { match: /value too long/i, tr: "Girdiğiniz değer çok uzun" },

  // Network / Edge functions
  { match: /failed to fetch|network ?error|networkerror/i, tr: "İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin." },
  { match: /timeout|timed out/i, tr: "İstek zaman aşımına uğradı. Lütfen tekrar deneyin." },
  { match: /function.*not.*found|not.*found.*function/i, tr: "Servis bulunamadı" },
  { match: /internal server error|500/i, tr: "Sunucu hatası. Lütfen daha sonra tekrar deneyin." },
  { match: /service unavailable|503/i, tr: "Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." },
  { match: /bad gateway|502/i, tr: "Sunucuya ulaşılamıyor. Lütfen tekrar deneyin." },

  // File / storage
  { match: /file.*too large|payload.*too large|file size/i, tr: "Dosya boyutu çok büyük" },
  { match: /invalid file type|unsupported.*type/i, tr: "Desteklenmeyen dosya türü" },
  { match: /storage.*quota|quota.*exceeded/i, tr: "Depolama kotası aşıldı" },

  // Phone
  { match: /invalid phone|phone.*invalid/i, tr: "Geçersiz telefon numarası" },
  { match: /phone.*already/i, tr: "Bu telefon numarası zaten kayıtlı" },

  // Generic
  { match: /^(unknown error|something went wrong|an error occurred)$/i, tr: "Bir hata oluştu" },
  { match: /bad request|400/i, tr: "Geçersiz istek" },
  { match: /not found|404/i, tr: "Aradığınız içerik bulunamadı" },
];

/**
 * Convert any error (string, Error, Supabase error) into a user-friendly Turkish message.
 */
export function translateError(err: unknown, fallback = "Bir hata oluştu"): string {
  if (!err) return fallback;

  let raw = "";
  if (typeof err === "string") {
    raw = err;
  } else if (err instanceof Error) {
    raw = err.message;
  } else if (typeof err === "object") {
    const anyErr = err as any;
    raw = anyErr?.message || anyErr?.error_description || anyErr?.error || anyErr?.msg || "";
  }

  if (!raw) return fallback;

  // Already Turkish? Heuristic: contains Turkish-specific chars or common Turkish words
  if (/[çğıöşü]/i.test(raw) || /\b(hata|geçersiz|bulunamadı|başarısız|lütfen|gerekli|zaten)\b/i.test(raw)) {
    return raw;
  }

  for (const entry of ERROR_MAP) {
    if (entry.match.test(raw)) return entry.tr;
  }

  // Unknown English error → fallback (don't show raw English to user)
  return fallback;
}