import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/hooks/useNative";

import { translateError } from "@/lib/translateError";
const passwordRules = [
  { id: "length", label: "8+ karakter", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "Büyük harf", test: (p: string) => /[A-ZÇĞİÖŞÜ]/.test(p) },
  { id: "digit", label: "Rakam", test: (p: string) => /\d/.test(p) },
];

type Mode = "login" | "register" | "forgot";

const MobileAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+90 ");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPasswordValid = passwordRules.every((r) => r.test(password));

  const formatPhone = (val: string) => {
    if (!val.startsWith("+90")) val = "+90 " + val.replace(/^\+?9?0?\s*/, "");
    const digits = val.slice(3).replace(/\D/g, "");
    let f = "+90 ";
    if (digits.length > 0) f += digits.slice(0, 3);
    if (digits.length > 3) f += " " + digits.slice(3, 6);
    if (digits.length > 6) f += " " + digits.slice(6, 8);
    if (digits.length > 8) f += " " + digits.slice(8, 10);
    return f;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Lütfen tüm alanları doldurun"); return; }
    setLoading(true);
    haptic.light();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      haptic.success();
      toast.success("Giriş başarılı!");
      navigate(redirect);
    } catch (err: any) {
      haptic.error();
      toast.error(translateError(err, "Giriş yapılamadı");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = phone.replace(/\D/g, "");
    if (!fullName.trim() || !email || !password || phoneDigits.length < 12) {
      toast.error("Lütfen tüm alanları doldurun"); return;
    }
    if (!isPasswordValid) { toast.error("Şifre kurallarını karşılamıyor"); return; }
    setLoading(true);
    haptic.light();
    try {
      const { data: phoneExists } = await supabase.rpc("check_phone_exists", { p_phone: phone.trim() });
      if (phoneExists) { haptic.error(); toast.error("Bu telefon zaten kayıtlı"); setLoading(false); return; }

      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: "https://www.qrpark.xyz/",
          data: { full_name: fullName.trim(), phone: phone.trim() },
        },
      });
      if (error) throw error;
      haptic.success();
      toast.success("Kayıt oluşturuldu! E-postanı doğrula.");
      setMode("login");
    } catch (err: any) {
      haptic.error();
      toast.error(translateError(err, "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("E-posta gerekli"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      haptic.success();
      toast.success("Sıfırlama bağlantısı gönderildi");
      setMode("login");
    } catch (err: any) {
      toast.error(translateError(err, "İşlem başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} className="bg-background" />

      {/* Header / Hero */}
      <div className="px-6 pt-8 pb-6">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 active:opacity-60">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Car className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold text-foreground">
            QR<span className="text-primary">Park</span>
          </span>
        </Link>
        <motion.h1
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-display font-bold text-foreground"
        >
          {mode === "login" ? "Tekrar hoş geldin" : mode === "register" ? "Hesap oluştur" : "Şifreni sıfırla"}
        </motion.h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "login" ? "Hesabına giriş yap" : mode === "register" ? "Birkaç saniyede başla" : "Sana bağlantı göndereceğiz"}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pb-8">
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            onSubmit={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleForgot}
            className="space-y-4"
          >
            {mode === "register" && (
              <>
                <Field icon={<User className="w-5 h-5" />} label="Ad Soyad">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none text-base"
                    maxLength={100}
                  />
                </Field>
                <Field icon={<Phone className="w-5 h-5" />} label="Telefon">
                  <input
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none text-base tracking-wide"
                    maxLength={17}
                  />
                </Field>
              </>
            )}

            <Field icon={<Mail className="w-5 h-5" />} label="E-posta">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none text-base"
              />
            </Field>

            {mode !== "forgot" && (
              <Field icon={<Lock className="w-5 h-5" />} label="Şifre">
                <div className="flex items-center gap-2 w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-muted-foreground active:text-foreground p-1 -mr-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </Field>
            )}

            {mode === "register" && password.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {passwordRules.map((r) => {
                  const ok = r.test(password);
                  return (
                    <span
                      key={r.id}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${
                        ok
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {r.label}
                    </span>
                  );
                })}
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-sm text-primary font-medium ml-1 active:opacity-60"
              >
                Şifremi unuttum
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Giriş Yap" : mode === "register" ? "Hesap Oluştur" : "Bağlantı Gönder"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        {/* Mode switcher */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Hesabın yok mu?{" "}
              <button onClick={() => setMode("register")} className="text-primary font-bold active:opacity-60">
                Kayıt Ol
              </button>
            </>
          ) : (
            <>
              Hesabın var mı?{" "}
              <button onClick={() => setMode("login")} className="text-primary font-bold active:opacity-60">
                Giriş Yap
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl bg-card border border-border px-4 pt-2.5 pb-2.5 focus-within:border-primary/60 transition-colors">
    <div className="flex items-center gap-3">
      <span className="text-primary">{icon}</span>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
        {children}
      </div>
    </div>
  </div>
);

export default MobileAuth;
