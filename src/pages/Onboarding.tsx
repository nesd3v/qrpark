import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, Phone, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("+90 ");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingVehicle, setCheckingVehicle] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user already has a vehicle
    const check = async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (data && data.length > 0) {
        navigate("/dashboard");
      }
      setCheckingVehicle(false);
    };
    check();
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneDigits = phone.replace(/\D/g, "");
    const trimmedPlate = plate.trim().toUpperCase();

    if (phoneDigits.length < 12) {
      toast.error("Lütfen geçerli bir telefon numarası girin");
      return;
    }
    if (trimmedPlate.length < 5) {
      toast.error("Lütfen geçerli bir plaka girin");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("vehicles").insert({
        plate: trimmedPlate,
        phone: phone.trim(),
        user_id: user!.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Bu plaka zaten kayıtlı");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Araç bilgileriniz kaydedildi!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingVehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Car className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Hoş Geldiniz!
          </h1>
          <p className="text-muted-foreground text-sm">
            QR kodunuzu oluşturabilmek için araç bilgilerinizi girin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="plate" className="text-foreground font-medium flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" /> Plaka
            </Label>
            <Input
              id="plate"
              placeholder="34 ABC 123"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground tracking-wider font-medium"
              maxLength={15}
            />
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Kaydediliyor...
              </span>
            ) : (
              <>
                Devam Et
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span>Bilgileriniz güvenle saklanacaktır</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
