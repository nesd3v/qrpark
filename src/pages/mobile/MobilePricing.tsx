import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Check, X, Loader2, Zap, Building2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaytrCheckoutHandler } from "@/hooks/usePaytrCheckoutHandler";
import { supabase } from "@/integrations/supabase/client";
import PayTRModal from "@/components/subscription/PayTRModal";
import BillingInfoDialog, { BillingInfo } from "@/components/subscription/BillingInfoDialog";
import { haptic } from "@/hooks/useNative";

import { translateError } from "@/lib/translateError";
const features = [
  "Sınırsız araç kaydı",
  "Süresiz QR kod",
  "Sınırsız bildirim geçmişi",
  "Detaylı istatistikler",
  "Özel QR tema & renk",
  "Öncelikli destek",
];

const MobilePricing = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = useSubscription();
  usePaytrCheckoutHandler();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paytrToken, setPaytrToken] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [billingOpen, setBillingOpen] = useState(false);

  const handleCheckout = () => {
    if (authLoading) return;
    if (!user) { navigate("/auth?redirect=/pricing"); return; }
    haptic.light();
    setBillingOpen(true);
  };

  const submitCheckout = async (billing: BillingInfo) => {
    setLoadingPlan(selectedPlan);
    try {
      const { data, error } = await supabase.functions.invoke("create-paytr-token", {
        body: { planType: selectedPlan, accountType: "individual", billing },
      });
      if (error) throw error;
      if (data?.token) {
        setPaytrToken(data.token);
        setBillingOpen(false);
      } else throw new Error(data?.error || "Token alınamadı");
    } catch (err: any) {
      haptic.error();
      toast.error("Ödeme başlatılamadı: " + translateError(err, "Bilinmeyen hata"));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <MobileLayout title="Premium" showBack>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2 pb-6"
      >
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 items-center justify-center mb-3 shadow-lg shadow-primary/30">
          <Crown className="w-7 h-7 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">QRPark Premium</h2>
        <p className="text-sm text-muted-foreground mt-1">Tüm özelliklerin kilidini aç</p>
      </motion.div>

      {isPremium ? (
        <div className="bg-card border-2 border-primary rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-5 h-5 text-primary" />
            <p className="font-display font-bold text-foreground">Premium aktif</p>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Tüm premium özelliklerden yararlanıyorsunuz.</p>
          <button
            onClick={() => navigate("/subscription")}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
          >
            Aboneliği Yönet
          </button>
        </div>
      ) : (
        <>
          {/* Plan toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                selectedPlan === "monthly" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
              }`}
            >
              <p>Aylık</p>
              <p className="text-xs font-normal mt-0.5">₺39/ay</p>
            </button>
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all relative ${
                selectedPlan === "yearly" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
              }`}
            >
              <span className="absolute -top-2 right-2 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                %25
              </span>
              <p>Yıllık</p>
              <p className="text-xs font-normal mt-0.5">₺349/yıl</p>
            </button>
          </div>

          {/* Features */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                </div>
                <p className="text-sm text-foreground">{f}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleCheckout}
            disabled={!!loadingPlan}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loadingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Premium'a Geç • {selectedPlan === "monthly" ? "₺39" : "₺349"}
          </button>
          <p className="text-center text-[11px] text-muted-foreground mt-3">
            Güvenli ödeme PayTR üzerinden işlenir. Dilediğiniz zaman iptal edebilirsiniz.
          </p>
        </>
      )}

      {/* Corporate */}
      <button
        onClick={() => navigate("/corporate-contact")}
        className="w-full mt-6 p-4 rounded-2xl bg-card border border-border text-left flex items-center gap-3 active:bg-muted/30"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Kurumsal Çözümler</p>
          <p className="text-xs text-muted-foreground">Filo yönetimi için iletişime geçin</p>
        </div>
      </button>

      <PayTRModal token={paytrToken} onClose={() => setPaytrToken(null)} />
    </MobileLayout>
  );
};

export default MobilePricing;
