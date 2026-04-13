import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Crown, Zap, Loader2, Car, Bell, QrCode, Palette, BarChart3, Phone, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import PayTRModal from "@/components/subscription/PayTRModal";

const comparisonRows = [
  { feature: "Araç kaydı", free: "1 araç", premium: "Sınırsız", icon: Car },
  { feature: "QR kod süresi", free: "7 gün", premium: "Süresiz", icon: QrCode },
  { feature: "QR yenileme", free: "Haftada 1", premium: "Sınırsız", icon: Clock },
  { feature: "Bildirim geçmişi", free: "Son 5", premium: "Sınırsız", icon: Bell },
  { feature: "Bildirim istatistikleri", free: false, premium: true, icon: BarChart3 },
  { feature: "Özel QR tema & renk", free: false, premium: true, icon: Palette },
  { feature: "Öncelikli destek", free: false, premium: true, icon: Shield },
  { feature: "QR süre dolum hatırlatması", free: false, premium: "Otomatik SMS & E-posta", icon: Phone },
];

const Pricing = () => {
  const { user } = useAuth();
  const { isPremium, subscribed, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paytrToken, setPaytrToken] = useState<string | null>(null);

  const handlePayTRCheckout = async (planType: "monthly" | "yearly") => {
    if (!user) { navigate("/auth?redirect=/pricing"); return; }
    setLoadingPlan(planType);
    try {
      const { data, error } = await supabase.functions.invoke("create-paytr-token", { body: { planType } });
      if (error) throw error;
      if (data?.token) setPaytrToken(data.token);
      else throw new Error(data?.error || "Token alınamadı");
    } catch (err: any) {
      toast.error("Ödeme sayfası oluşturulamadı: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Planınızı <span className="text-primary">Seçin</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              İhtiyacınıza uygun planı seçerek aracınızı daha iyi koruyun
            </p>
          </motion.div>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {/* Free */}
            <motion.div className="glass rounded-2xl p-8 border border-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Ücretsiz</h3>
              <p className="text-xs text-muted-foreground mb-4">Başlangıç için ideal</p>
              <div className="mb-6"><span className="text-4xl font-bold text-foreground">₺0</span><span className="text-muted-foreground">/ay</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><Car className="w-4 h-4 flex-shrink-0" /> 1 araç kaydı</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><QrCode className="w-4 h-4 flex-shrink-0" /> QR kod 7 gün geçerli</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><Bell className="w-4 h-4 flex-shrink-0" /> Son 5 bildirim</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><Clock className="w-4 h-4 flex-shrink-0" /> Haftada 1 QR yenileme</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground/50"><X className="w-4 h-4 flex-shrink-0" /> İstatistikler yok</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground/50"><X className="w-4 h-4 flex-shrink-0" /> Özel QR tema yok</li>
              </ul>
              <button className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium cursor-default" disabled>
                {!subscribed ? "Mevcut Plan" : "Ücretsiz Plan"}
              </button>
            </motion.div>

            {/* Monthly */}
            <motion.div className="glass rounded-2xl p-8 border-2 border-primary relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">POPÜLER</div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2 flex items-center gap-2"><Crown className="w-5 h-5 text-primary" /> Premium Aylık</h3>
              <p className="text-xs text-muted-foreground mb-4">Bireysel kullanım için</p>
              <div className="mb-6"><span className="text-4xl font-bold text-foreground">₺39</span><span className="text-muted-foreground">/ay</span></div>
              <ul className="space-y-3 mb-8">
                {["Sınırsız araç kaydı","Süresiz QR kod","Sınırsız bildirim geçmişi","Detaylı istatistikler","Özel QR tema & renk","Sınırsız QR yenileme","Öncelikli destek"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground"><Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              {isPremium ? (
                <button onClick={() => navigate("/subscription")} className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors">Aboneliği Yönet</button>
              ) : (
                <button onClick={() => handlePayTRCheckout("monthly")} disabled={!!loadingPlan || subLoading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  {loadingPlan === "monthly" && <Loader2 className="w-4 h-4 animate-spin" />}<Zap className="w-4 h-4" /> Premium'a Geç
                </button>
              )}
            </motion.div>

            {/* Yearly */}
            <motion.div className="glass rounded-2xl p-8 border border-border relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-4 py-1 rounded-full">%25 TASARRUF</div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2 flex items-center gap-2"><Crown className="w-5 h-5 text-primary" /> Premium Yıllık</h3>
              <p className="text-xs text-muted-foreground mb-4">En uygun fiyat</p>
              <div className="mb-1"><span className="text-4xl font-bold text-foreground">₺349</span><span className="text-muted-foreground">/yıl</span></div>
              <p className="text-xs text-primary mb-6">≈ ₺29/ay</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-foreground"><Check className="w-4 h-4 text-primary flex-shrink-0" /> Aylık Premium'un tüm özellikleri</li>
                <li className="flex items-center gap-3 text-sm text-foreground"><Check className="w-4 h-4 text-primary flex-shrink-0" /> Yıllık %25 indirim</li>
              </ul>
              {isPremium ? (
                <button onClick={() => navigate("/subscription")} className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors">Aboneliği Yönet</button>
              ) : (
                <button onClick={() => handlePayTRCheckout("yearly")} disabled={!!loadingPlan || subLoading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  {loadingPlan === "yearly" && <Loader2 className="w-4 h-4 animate-spin" />}<Zap className="w-4 h-4" /> Yıllık Premium
                </button>
              )}
            </motion.div>
          </div>

          {/* Comparison */}
          <motion.div className="max-w-3xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">Plan <span className="text-primary">Karşılaştırma</span></h2>
            <div className="glass rounded-2xl overflow-hidden border border-border">
              <div className="grid grid-cols-3 gap-0 border-b border-border bg-secondary/30">
                <div className="p-4 text-sm font-medium text-muted-foreground">Özellik</div>
                <div className="p-4 text-sm font-medium text-muted-foreground text-center">Ücretsiz</div>
                <div className="p-4 text-sm font-medium text-primary text-center flex items-center justify-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Premium</div>
              </div>
              {comparisonRows.map((row, i) => (
                <div key={i} className={`grid grid-cols-3 gap-0 ${i < comparisonRows.length - 1 ? "border-b border-border/50" : ""}`}>
                  <div className="p-4 flex items-center gap-2 text-sm text-foreground"><row.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />{row.feature}</div>
                  <div className="p-4 flex items-center justify-center">
                    {typeof row.free === "boolean" ? (row.free ? <Check className="w-4 h-4 text-primary" /> : <X className="w-4 h-4 text-muted-foreground/40" />) : <span className="text-sm text-muted-foreground">{row.free}</span>}
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    {typeof row.premium === "boolean" ? (row.premium ? <Check className="w-4 h-4 text-primary" /> : <X className="w-4 h-4 text-muted-foreground/40" />) : <span className="text-sm font-medium text-primary">{row.premium}</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
      {paytrToken && <PayTRModal token={paytrToken} onClose={() => setPaytrToken(null)} />}
    </div>
  );
};

export default Pricing;
