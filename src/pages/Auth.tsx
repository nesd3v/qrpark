import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Car, Phone, User, Mail, CheckCircle2, ArrowRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

const Auth = () => {
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [phone, setPhone] = useState("+90 ");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  // If already logged in, redirect away
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate(redirect, { replace: true });
      } else {
        setAuthChecked(true);
      }
    });
  }, [navigate, redirect]);

  const formatPhone = (val: string) => {
    if (!val.startsWith("+90")) val = "+90 " + val.replace(/^\+?9?0?\s*/, "");
    const digits = val.slice(3).replace(/[^\d]/g, "");
    let f = "+90 ";
    if (digits.length > 0) f += digits.slice(0, 3);
    if (digits.length > 3) f += " " + digits.slice(3, 6);
    if (digits.length > 6) f += " " + digits.slice(6, 8);
    if (digits.length > 8) f += " " + digits.slice(8, 10);
    return f;
  };

  const phoneDigits = phone.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length >= 12;

  const startCountdown = () => {
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!isPhoneValid) { toast.error("Geçerli bir telefon numarası girin"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("phone-otp", {
        body: { action: "send", phone: phone.trim() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setLoading(false); return; }
      toast.success("Doğrulama kodu gönderildi!");
      setStep("otp");
      startCountdown();
    } catch (err: any) {
      toast.error(err.message || "SMS gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { toast.error("6 haneli kodu girin"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("phone-otp", {
        body: { action: "verify", phone: phone.trim(), code: otp },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setLoading(false); return; }

      if (data.isNewUser) {
        setStep("profile");
      } else {
        // Existing user - sign in
        const { error: signInError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });
        if (signInError) throw signInError;
        toast.success("Giriş başarılı!");
        navigate(redirect);
      }
    } catch (err: any) {
      toast.error(err.message || "Doğrulama başarısız");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete profile
  const handleCompleteProfile = async () => {
    if (!fullName.trim()) { toast.error("İsim soyisim gerekli"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("phone-otp", {
        body: {
          action: "complete-profile",
          phone: phone.trim(),
          full_name: fullName.trim(),
          email: email.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setLoading(false); return; }

      const { error: signInError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });
      if (signInError) throw signInError;
      toast.success("Hesabınız oluşturuldu!");
      navigate(redirect);
    } catch (err: any) {
      toast.error(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("phone-otp", {
        body: { action: "send", phone: phone.trim() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setLoading(false); return; }
      toast.success("Yeni kod gönderildi!");
      startCountdown();
      setOtp("");
    } catch (err: any) {
      toast.error(err.message || "Kod gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Car className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">
              QR<span className="text-primary">Park</span>
            </span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => {
              const stepIndex = step === "phone" ? 1 : step === "otp" ? 2 : 3;
              const isActive = s <= stepIndex;
              return (
                <div key={s} className={`h-1.5 rounded-full transition-all ${s === stepIndex ? "w-8 bg-primary" : isActive ? "w-6 bg-primary/50" : "w-6 bg-muted"}`} />
              );
            })}
          </div>
        </div>

        {/* ========== STEP 1: PHONE ========== */}
        {step === "phone" && (
          <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-display font-bold text-foreground">Telefon Numaranız</h1>
              <p className="text-muted-foreground text-sm mt-1">Doğrulama kodu göndereceğiz</p>
            </div>
            <div className="glass rounded-2xl p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> Telefon
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">🇹🇷</span>
                  <Input
                    id="phone"
                    placeholder="5XX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pl-10 tracking-wide text-lg"
                    maxLength={17}
                    autoFocus
                  />
                </div>
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={loading || !isPhoneValid}
                className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Doğrulama Kodu Gönder <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ========== STEP 2: OTP ========== */}
        {step === "otp" && (
          <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-display font-bold text-foreground">Doğrulama Kodu</h1>
              <p className="text-muted-foreground text-sm mt-1">
                <span className="text-primary font-medium">{phone}</span> numarasına gönderilen 6 haneli kodu girin
              </p>
            </div>
            <div className="glass rounded-2xl p-8 space-y-5">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Doğrula <CheckCircle2 className="w-4 h-4 ml-2" /></>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={countdown > 0 || loading}
                  className="text-sm text-primary hover:underline font-medium disabled:text-muted-foreground disabled:no-underline"
                >
                  {countdown > 0 ? `Tekrar gönder (${countdown}s)` : "Kodu tekrar gönder"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep("phone"); setOtp(""); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
              >
                ← Numarayı değiştir
              </button>
            </div>
          </motion.div>
        )}

        {/* ========== STEP 3: PROFILE ========== */}
        {step === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-display font-bold text-foreground">Profilinizi Tamamlayın</h1>
              <p className="text-muted-foreground text-sm mt-1">Son adım — bilgilerinizi girin</p>
            </div>
            <div className="glass rounded-2xl p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Ad Soyad
                </Label>
                <Input
                  id="fullName"
                  placeholder="Ahmet Yılmaz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> E-posta <span className="text-xs text-muted-foreground">(opsiyonel)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-[11px] text-muted-foreground">Kampanya ve bilgilendirmeler için kullanılır</p>
              </div>

              <Button
                onClick={handleCompleteProfile}
                disabled={loading || !fullName.trim()}
                className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Hesabı Oluştur <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
