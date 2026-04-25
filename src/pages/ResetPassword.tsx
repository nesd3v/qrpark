import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Car, Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";

import { translateError } from "@/lib/translateError";
const passwordRules = [
  { id: "length", label: "En az 8 karakter", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "En az 1 büyük harf", test: (p: string) => /[A-ZÇĞİÖŞÜ]/.test(p) },
  { id: "digit", label: "En az 1 rakam", test: (p: string) => /\d/.test(p) },
  { id: "punct", label: "En az 1 noktalama işareti", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  const isPasswordValid = passwordRules.every((r) => r.test(password));

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error("Şifre güvenlik kurallarını karşılamıyor");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Şifreniz başarıyla güncellendi!");
      navigate("/");
    } catch (err: any) {
      toast.error(translateError(err, "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div className="text-center max-w-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-muted-foreground mb-4">Şifre sıfırlama bağlantısı bekleniyor...</p>
          <Link to="/auth" className="text-primary hover:underline text-sm">Giriş sayfasına dön</Link>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-display font-bold text-foreground">Yeni Şifre Belirle</h1>
          <p className="text-muted-foreground text-sm mt-1">Yeni şifrenizi girin</p>
        </div>

        <form onSubmit={handleReset} className="glass rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-foreground font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Yeni Şifre
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
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

          <Button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
