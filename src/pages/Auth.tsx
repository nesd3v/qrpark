import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Car, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, User, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

const passwordRules = [
  { id: "length", label: "En az 8 karakter", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "En az 1 büyük harf", test: (p: string) => /[A-ZÇĞİÖŞÜ]/.test(p) },
  { id: "digit", label: "En az 1 rakam", test: (p: string) => /\d/.test(p) },
  { id: "punct", label: "En az 1 noktalama işareti", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+90 ");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [registered, setRegistered] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error("Google ile giriş yapılamadı");
    }
  };

  const handleAppleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error("Apple ile giriş yapılamadı");
    }
  };

  const isPasswordValid = passwordRules.every((r) => r.test(password));

  const isAppleDevice = useMemo(() => {
    const ua = navigator.userAgent || "";
    return /iPhone|iPad|iPod|Macintosh/.test(ua);
  }, []);

  // --- Register ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = phone.replace(/\D/g, "");
    if (!fullName.trim() || !email || !password || phoneDigits.length < 12) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    if (!isPasswordValid) {
      toast.error("Şifre güvenlik kurallarını karşılamıyor");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });
      if (error) throw error;
      setRegistered(true);
    } catch (err: any) {
      toast.error(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // --- Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Giriş başarılı!");
      navigate(redirect);
    } catch (err: any) {
      toast.error(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot password ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Lütfen e-posta adresinizi girin");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi!");
      setShowForgot(false);
    } catch (err: any) {
      toast.error(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // ========== REGISTRATION SUCCESS ==========
  if (registered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div className="w-full max-w-md text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3">Kayıt Başarılı!</h1>
          <p className="text-muted-foreground mb-6">
            Lütfen e-posta adresinizi doğrulayın, ardından giriş yaparak QR kodunuzu oluşturabilirsiniz.
          </p>
          <Button
            onClick={() => { setRegistered(false); setIsLogin(true); }}
            className="gradient-primary text-primary-foreground font-semibold py-6 px-8 glow-primary hover:opacity-90 transition-opacity"
          >
            Giriş Sayfasına Git
          </Button>
        </motion.div>
      </div>
    );
  }

  // ========== FORGOT PASSWORD ==========
  if (showForgot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Car className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">
                QR<span className="text-primary">Park</span>
              </span>
            </Link>
            <h1 className="text-2xl font-display font-bold text-foreground">Şifremi Unuttum</h1>
            <p className="text-muted-foreground text-sm mt-1">E-posta adresinize sıfırlama bağlantısı göndereceğiz</p>
          </div>
          <form onSubmit={handleForgotPassword} className="glass rounded-2xl p-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-foreground font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> E-posta
              </Label>
              <Input id="forgot-email" type="email" placeholder="ornek@email.com" value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40">
              {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <button type="button" onClick={() => setShowForgot(false)} className="text-primary hover:underline font-medium">
                Giriş sayfasına dön
              </button>
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  // ========== LOGIN ==========
  if (isLogin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Car className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">
                QR<span className="text-primary">Park</span>
              </span>
            </Link>
            <h1 className="text-2xl font-display font-bold text-foreground">Giriş Yap</h1>
            <p className="text-muted-foreground text-sm mt-1">Hesabınıza giriş yapın</p>
          </div>
          <form onSubmit={handleLogin} className="glass rounded-2xl p-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> E-posta
              </Label>
              <Input id="email" type="email" placeholder="ornek@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Şifre
              </Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-primary hover:underline">
                Şifremi unuttum
              </button>
            </div>
            <Button type="submit" disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40">
              {loading ? "Yükleniyor..." : "Giriş Yap"}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">veya</span></div>
            </div>

            <Button type="button" variant="outline" onClick={handleGoogleSignIn}
              className="w-full py-6 text-base font-medium border-border hover:bg-secondary/80 transition-colors">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google ile Giriş Yap
            </Button>

            <Button type="button" variant="outline" onClick={handleAppleSignIn}
              className="w-full py-6 text-base font-medium border-border hover:bg-secondary/80 transition-colors">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.35-3.74 4.25z"/></svg>
              Apple ile Giriş Yap
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Hesabınız yok mu?{" "}
              <button type="button" onClick={() => setIsLogin(false)}
                className="text-primary hover:underline font-medium">Kayıt Ol</button>
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  // ========== REGISTRATION ==========
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Car className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">
              QR<span className="text-primary">Park</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Kayıt Ol</h1>
          <p className="text-muted-foreground text-sm mt-1">Yeni hesap oluşturun</p>
        </div>

        <form onSubmit={handleRegister} className="glass rounded-2xl p-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Ad Soyad
            </Label>
            <Input id="fullName" placeholder="Ahmet Yılmaz" value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Telefon Numarası
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">🇹🇷</span>
              <Input
                id="phone"
                placeholder="5XX XXX XX XX"
                value={phone}
                onChange={(e) => {
                  let val = e.target.value;
                  if (!val.startsWith("+90")) {
                    val = "+90 " + val.replace(/^\+?9?0?\s*/, "");
                  }
                  const afterPrefix = val.slice(3).replace(/[^\d\s]/g, "");
                  const digits = afterPrefix.replace(/\s/g, "");
                  let formatted = "+90 ";
                  if (digits.length > 0) formatted += digits.slice(0, 3);
                  if (digits.length > 3) formatted += " " + digits.slice(3, 6);
                  if (digits.length > 6) formatted += " " + digits.slice(6, 8);
                  if (digits.length > 8) formatted += " " + digits.slice(8, 10);
                  setPhone(formatted);
                }}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pl-10 tracking-wide"
                maxLength={17}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Bildirimler bu numaraya gönderilecek</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> E-posta
            </Label>
            <Input id="email" type="email" placeholder="ornek@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Şifre
            </Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-1 mt-2">
                {passwordRules.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <div key={rule.id} className="flex items-center gap-2 text-xs">
                      {passed ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                      <span className={passed ? "text-primary" : "text-muted-foreground"}>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40">
            {loading ? "Yükleniyor..." : "Kayıt Ol"}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">veya</span></div>
          </div>

          <Button type="button" variant="outline" onClick={handleGoogleSignIn}
            className="w-full py-6 text-base font-medium border-border hover:bg-secondary/80 transition-colors">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google ile Kayıt Ol
          </Button>

          <Button type="button" variant="outline" onClick={handleAppleSignIn}
            className="w-full py-6 text-base font-medium border-border hover:bg-secondary/80 transition-colors">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.35-3.74 4.25z"/></svg>
            Apple ile Kayıt Ol
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Zaten hesabınız var mı?{" "}
          <button type="button" onClick={() => setIsLogin(true)}
            className="text-primary hover:underline font-medium">Giriş Yap</button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
