import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Crown, Zap, Loader2, Building2, User, Shield, Clock, Car, Bell, QrCode, Palette, BarChart3, Phone, Headphones } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaytrCheckoutHandler } from "@/hooks/usePaytrCheckoutHandler";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import PayTRModal from "@/components/subscription/PayTRModal";

type PlanTab = "bireysel" | "kurumsal";

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
  usePaytrCheckoutHandler();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paytrToken, setPaytrToken] = useState<string | null>(null);
  const [planTab, setPlanTab] = useState<PlanTab>("bireysel");

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

  const handleManageSubscription = () => {
    navigate("/subscription");
  };

  const handleCorporateContact = (plan: string) => {
    navigate(`/corporate-contact?plan=${plan}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-10"
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

          {/* Plan Type Tabs */}
          <motion.div
            className="flex justify-center mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex rounded-xl border border-border bg-secondary/50 p-1">
              <button
                onClick={() => setPlanTab("bireysel")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  planTab === "bireysel"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4" />
                Bireysel
              </button>
              <button
                onClick={() => setPlanTab("kurumsal")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  planTab === "kurumsal"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Kurumsal
              </button>
            </div>
          </motion.div>

          {planTab === "bireysel" ? (
            <>
              {/* Individual Plans */}
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                {/* Free Tier */}
                <motion.div
                  className="glass rounded-2xl p-8 border border-border relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Ücretsiz</h3>
                  <p className="text-xs text-muted-foreground mb-4">Başlangıç için ideal</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">₺0</span>
                    <span className="text-muted-foreground">/ay</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Car className="w-4 h-4 text-muted-foreground flex-shrink-0" /> 1 araç kaydı
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <QrCode className="w-4 h-4 text-muted-foreground flex-shrink-0" /> QR kod 7 gün geçerli
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" /> Son 5 bildirim
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" /> Haftada 1 QR yenileme
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground/50">
                      <X className="w-4 h-4 flex-shrink-0" /> İstatistikler yok
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground/50">
                      <X className="w-4 h-4 flex-shrink-0" /> Özel QR tema yok
                    </li>
                  </ul>
                  <button
                    className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium cursor-default"
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
                    <Crown className="w-5 h-5 text-primary" /> Premium Aylık
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Bireysel kullanım için</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">₺39</span>
                    <span className="text-muted-foreground">/ay</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> Sınırsız araç kaydı
                    </li>
                    <li className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> Süresiz QR kod
                    </li>
                    <li className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> Sınırsız bildirim geçmişi
                    </li>
                    <li className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> Detaylı istatistikler
                    </li>
                    <li className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> Özel QR tema & renk
                    </li>
                    <li className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> Sınırsız QR yenileme
                    </li>
                    <li className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> Öncelikli destek
                    </li>
                  </ul>
                  {isPremium ? (
                    <button
                      onClick={handleManageSubscription}
                      className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                    >
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
                    <Crown className="w-5 h-5 text-primary" /> Premium Yıllık
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">En uygun fiyat</p>
                  <div className="mb-1">
                    <span className="text-4xl font-bold text-foreground">₺349</span>
                    <span className="text-muted-foreground">/yıl</span>
                  </div>
                  <p className="text-xs text-primary mb-6">≈ ₺29/ay</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> Aylık Premium'un tüm özellikleri
                    </li>
                    <li className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" /> Yıllık %25 indirim
                    </li>
                  </ul>
                  {isPremium ? (
                    <button
                      onClick={handleManageSubscription}
                      className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                    >
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

              {/* Comparison Table */}
              <motion.div
                className="max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">
                  Plan <span className="text-primary">Karşılaştırma</span>
                </h2>
                <div className="glass rounded-2xl overflow-hidden border border-border">
                  {/* Header */}
                  <div className="grid grid-cols-3 gap-0 border-b border-border bg-secondary/30">
                    <div className="p-4 text-sm font-medium text-muted-foreground">Özellik</div>
                    <div className="p-4 text-sm font-medium text-muted-foreground text-center">Ücretsiz</div>
                    <div className="p-4 text-sm font-medium text-primary text-center flex items-center justify-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" /> Premium
                    </div>
                  </div>
                  {/* Rows */}
                  {comparisonRows.map((row, i) => (
                    <div
                      key={i}
                      className={`grid grid-cols-3 gap-0 ${i < comparisonRows.length - 1 ? "border-b border-border/50" : ""}`}
                    >
                      <div className="p-4 flex items-center gap-2 text-sm text-foreground">
                        <row.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        {row.feature}
                      </div>
                      <div className="p-4 flex items-center justify-center">
                        {typeof row.free === "boolean" ? (
                          row.free ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{row.free}</span>
                        )}
                      </div>
                      <div className="p-4 flex items-center justify-center">
                        {typeof row.premium === "boolean" ? (
                          row.premium ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-primary">{row.premium}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            /* Corporate Plans */
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Kurumsal Filo */}
              <motion.div
                className="glass rounded-2xl p-8 border border-border relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">Filo Yönetimi</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Araç filoları için toplu QR yönetimi, merkezi bildirim paneli ve detaylı raporlama
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> 10+ araç için toplu kayıt
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> Merkezi yönetim paneli
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> Toplu QR kod oluşturma
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> Filo istatistikleri & raporlama
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> Kurumsal markalı QR kodlar
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> Süresiz QR kodlar
                  </li>
                </ul>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">Özel Fiyat</span>
                </div>
                <button
                  onClick={() => handleCorporateContact("filo")}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Headphones className="w-4 h-4" /> Başvuru Yap
                </button>
              </motion.div>

              {/* Kurumsal AVM / Otopark */}
              <motion.div
                className="glass rounded-2xl p-8 border-2 border-primary relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                  ÖNERİLEN
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">AVM & Otopark</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  AVM, site ve otopark yönetimleri için entegre bildirim sistemi
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> Filo Yönetimi'nin tüm özellikleri
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> Otopark giriş/çıkış entegrasyonu
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> Anons sistemi entegrasyonu
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> Çoklu kullanıcı & yetki yönetimi
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> API erişimi
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> 7/24 öncelikli destek
                  </li>
                </ul>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">Özel Fiyat</span>
                </div>
                <button
                  onClick={() => handleCorporateContact("avm")}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Headphones className="w-4 h-4" /> Başvuru Yap
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <PayTRModal token={paytrToken} onClose={() => setPaytrToken(null)} />
      <Footer />
    </div>
  );
};

export default Pricing;
