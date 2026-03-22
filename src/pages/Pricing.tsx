import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Car, Bell, BarChart3, QrCode, Loader2, Palette, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import PayTRModal from "@/components/PayTRModal";

const freeTierFeatures = [
  { icon: Car, text: "1 araç kaydı" },
  { icon: Bell, text: "Son 5 bildirim görüntüleme" },
  { icon: QrCode, text: "Temel QR kod" },
  { icon: Clock, text: "7 gün QR yenileme bekleme süresi" },
];

const premiumFeatures = [
  { icon: Car, text: "Sınırsız araç kaydı" },
  { icon: Bell, text: "Sınırsız bildirim geçmişi" },
  { icon: Palette, text: "Özel QR tema ve renk seçimi" },
  { icon: BarChart3, text: "Detaylı bildirim istatistikleri" },
  { icon: Clock, text: "Bekleme süresi olmadan QR yenileme" },
  { icon: Shield, text: "Öncelikli destek" },
];

const Pricing = () => {
  const { user } = useAuth();
  const { isPremium, subscribed, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paytrToken, setPaytrToken] = useState<string | null>(null);

  const handlePayTRCheckout = async (planType: "monthly" | "yearly") => {
    if (!user) {
      navigate("/auth?redirect=/pricing");
      return;
    }

    setLoadingPlan(planType);
    try {
      const { data, error } = await supabase.functions.invoke("create-paytr-token", {
        body: { planType },
      });
      if (error) throw error;
      if (data?.token) {
        setPaytrToken(data.token);
      } else {
        throw new Error(data?.error || "Token alınamadı");
      }
    } catch (err: any) {
      toast.error("Ödeme sayfası oluşturulamadı: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPlan("manage");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Portal açılamadı: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Planınızı <span className="text-primary">Seçin</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              İhtiyacınıza uygun planı seçerek aracınızı daha iyi koruyun
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Tier */}
            <motion.div
              className="glass rounded-2xl p-8 border border-border relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Ücretsiz</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">₺0</span>
                <span className="text-muted-foreground">/ay</span>
              </div>
              <ul className="space-y-3 mb-8">
                {freeTierFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <f.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
              <button
                className="w-full py-3 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors"
                disabled
              >
                {!subscribed ? "Mevcut Plan" : "Ücretsiz Plan"}
              </button>
            </motion.div>

            {/* Premium Monthly */}
            <motion.div
              className="glass rounded-2xl p-8 border-2 border-primary relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                POPÜLER
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" /> Premium
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">₺39</span>
                <span className="text-muted-foreground">/ay</span>
              </div>
              <ul className="space-y-3 mb-8">
                {premiumFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
              {isPremium ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loadingPlan === "manage"}
                  className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingPlan === "manage" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Aboneliği Yönet
                </button>
              ) : (
                <button
                  onClick={() => handlePayTRCheckout("monthly")}
                  disabled={!!loadingPlan || subLoading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingPlan === "monthly" && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Zap className="w-4 h-4" /> Premium'a Geç
                </button>
              )}
            </motion.div>

            {/* Premium Yearly */}
            <motion.div
              className="glass rounded-2xl p-8 border border-border relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-4 py-1 rounded-full">
                %25 TASARRUF
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" /> Premium
              </h3>
              <div className="mb-1">
                <span className="text-4xl font-bold text-foreground">₺349</span>
                <span className="text-muted-foreground">/yıl</span>
              </div>
              <p className="text-xs text-primary mb-6">≈ ₺29/ay</p>
              <ul className="space-y-3 mb-8">
                {premiumFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
              {isPremium ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loadingPlan === "manage"}
                  className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingPlan === "manage" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Aboneliği Yönet
                </button>
              ) : (
                <button
                  onClick={() => handlePayTRCheckout("yearly")}
                  disabled={!!loadingPlan || subLoading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingPlan === "yearly" && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Zap className="w-4 h-4" /> Yıllık Premium
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <PayTRModal token={paytrToken} onClose={() => setPaytrToken(null)} />
      <Footer />
    </div>
  );
};

export default Pricing;
