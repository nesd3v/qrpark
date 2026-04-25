import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check, X, Crown, Zap, Loader2, Building2, User, Shield, Clock, Car, Bell,
  QrCode, Palette, BarChart3, Phone, Headphones, Infinity as InfinityIcon, Send,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaytrCheckoutHandler } from "@/hooks/usePaytrCheckoutHandler";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import PayTRModal from "@/components/subscription/PayTRModal";
import { translateError } from "@/lib/translateError";

type PlanTab = "bireysel" | "kurumsal";
type AccountType = "individual" | "corporate";
type PlanType = "monthly" | "yearly";

type CorporateInquiry = {
  id: string;
  status: string;
  payment_status: string;
  plan_type: string;
};

const individualRows = [
  { feature: "Araç kaydı", free: "1 araç", premium: "5 araç", icon: Car },
  { feature: "QR kod süresi", free: "7 gün", premium: "Süresiz", icon: QrCode },
  { feature: "QR yenileme", free: "Haftada 1", premium: "Sınırsız", icon: Clock },
  { feature: "Bildirim geçmişi", free: "Son 5", premium: "Sınırsız", icon: Bell },
  { feature: "İstatistikler", free: false, premium: true, icon: BarChart3 },
  { feature: "Özel QR tema & renk", free: false, premium: true, icon: Palette },
  { feature: "Öncelikli destek", free: false, premium: true, icon: Shield },
];

const Pricing = () => {
  const { user } = useAuth();
  const {
    isIndividualPremium,
    isCorporatePremium,
    loading: subLoading,
    checkSubscription,
  } = useSubscription();
  usePaytrCheckoutHandler();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paytrToken, setPaytrToken] = useState<string | null>(null);
  const [planTab, setPlanTab] = useState<PlanTab>("bireysel");
  const [pendingInquiry, setPendingInquiry] = useState<CorporateInquiry | null>(null);

  // Check for approved corporate inquiry awaiting payment
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("corporate_inquiries" as any)
        .select("id, status, payment_status, plan_type")
        .eq("user_id", user.id)
        .eq("payment_status", "pending_payment")
        .in("status", ["approved", "completed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setPendingInquiry(data as any);
    })();
  }, [user]);

  const handlePayTRCheckout = async (accountType: AccountType, planType: PlanType) => {
    if (!user) {
      navigate("/auth?redirect=/pricing");
      return;
    }
    const key = `${accountType}-${planType}`;
    setLoadingPlan(key);
    try {
      const { data, error } = await supabase.functions.invoke("create-paytr-token", {
        body: { planType, accountType },
      });
      if (error) throw error;
      if (data?.token) setPaytrToken(data.token);
      else throw new Error(data?.error || "Token alınamadı");
    } catch (err: any) {
      toast.error("Ödeme sayfası oluşturulamadı: " + translateError(err, "Bilinmeyen hata"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = () => navigate("/subscription");
  const handleCorporateContact = () => navigate(`/corporate-contact?plan=filo`);

  const PriceCard = ({
    accent = false,
    badge,
    icon: Icon,
    title,
    subtitle,
    price,
    priceSuffix,
    helper,
    features,
    actionLabel,
    actionIcon: ActionIcon,
    onClick,
    disabled,
    loading,
    delay = 0,
    currentLabel,
    isCurrent,
  }: {
    accent?: boolean;
    badge?: string;
    icon: any;
    title: string;
    subtitle: string;
    price: string;
    priceSuffix: string;
    helper?: string;
    features: string[];
    actionLabel: string;
    actionIcon?: any;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    delay?: number;
    currentLabel?: string;
    isCurrent?: boolean;
  }) => (
    <motion.div
      className={`glass rounded-2xl p-8 relative ${accent ? "border-2 border-primary" : "border border-border"}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
          {badge}
        </div>
      )}
      <h3 className="text-xl font-display font-bold text-foreground mb-2 flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" /> {title}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      <div className="mb-1">
        <span className="text-4xl font-bold text-foreground">{price}</span>
        <span className="text-muted-foreground">{priceSuffix}</span>
      </div>
      {helper && <p className="text-xs text-primary mb-6">{helper}</p>}
      {!helper && <div className="mb-6" />}
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-foreground">
            <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
          </li>
        ))}
      </ul>
      {isCurrent ? (
        <button
          onClick={handleManageSubscription}
          className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
        >
          {currentLabel ?? "Aboneliği Yönet"}
        </button>
      ) : (
        <button
          onClick={onClick}
          disabled={disabled || loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {ActionIcon && !loading && <ActionIcon className="w-4 h-4" />}
          {actionLabel}
        </button>
      )}
    </motion.div>
  );

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

          {/* Approved corporate awaiting payment banner */}
          {pendingInquiry && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto mb-8 glass rounded-2xl p-5 border border-primary/40 bg-primary/5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    Kurumsal başvurunuz onaylandı 🎉
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Kurumsal Premium aboneliğinizi aktifleştirmek için aşağıdan ödeme yapmanız gerekiyor.
                  </p>
                  <div className="bg-background/60 rounded-xl p-3 mb-3 space-y-2">
                    <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                      Sonraki adımlar
                    </p>
                    <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                      <li>Aşağıdan size uygun Kurumsal planı (Aylık ₺500 / Yıllık ₺4.990) seçin.</li>
                      <li>"Şimdi Öde" butonuna basın ve PayTR güvenli ödeme ekranında ödemeyi tamamlayın.</li>
                      <li>Ödeme onaylandıktan sonra Kurumsal Premium otomatik aktifleşir.</li>
                      <li>Aktifleştikten sonra <span className="font-medium text-foreground">/corporate</span> kurumsal panele ve sınırsız araç yönetimine erişebilirsiniz.</li>
                    </ol>
                  </div>
                  <button
                    onClick={() => setPlanTab("kurumsal")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Kurumsal planlara git →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

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
                  planTab === "bireysel" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4" /> Bireysel
              </button>
              <button
                onClick={() => setPlanTab("kurumsal")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  planTab === "kurumsal" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="w-4 h-4" /> Kurumsal
              </button>
            </div>
          </motion.div>

          {planTab === "bireysel" ? (
            <>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                {/* Free */}
                <motion.div
                  className="glass rounded-2xl p-8 border border-border"
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
                    <li className="flex items-center gap-3 text-sm text-muted-foreground"><Car className="w-4 h-4 flex-shrink-0" /> 1 araç kaydı</li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground"><QrCode className="w-4 h-4 flex-shrink-0" /> QR 7 gün geçerli</li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground"><Bell className="w-4 h-4 flex-shrink-0" /> Son 5 bildirim</li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground/50"><X className="w-4 h-4 flex-shrink-0" /> İstatistikler yok</li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground/50"><X className="w-4 h-4 flex-shrink-0" /> Özel QR tema yok</li>
                  </ul>
                  <button className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium cursor-default" disabled>
                    {!isIndividualPremium ? "Mevcut Plan" : "Ücretsiz"}
                  </button>
                </motion.div>

                {/* Bireysel Aylık */}
                <PriceCard
                  accent
                  badge="POPÜLER"
                  icon={Crown}
                  title="Bireysel Aylık"
                  subtitle="Bireysel kullanım için"
                  price="₺350"
                  priceSuffix="/ay"
                  features={[
                    "5 araç kaydı",
                    "Süresiz QR kod",
                    "Sınırsız bildirim geçmişi",
                    "Detaylı istatistikler",
                    "Özel QR tema & renk",
                    "Sınırsız QR yenileme",
                    "Öncelikli destek",
                  ]}
                  actionLabel="Premium'a Geç"
                  actionIcon={Zap}
                  onClick={() => handlePayTRCheckout("individual", "monthly")}
                  loading={loadingPlan === "individual-monthly"}
                  disabled={!!loadingPlan || subLoading}
                  delay={0.2}
                  isCurrent={isIndividualPremium}
                  currentLabel="Aboneliği Yönet"
                />

                {/* Bireysel Yıllık */}
                <PriceCard
                  badge="%17 TASARRUF"
                  icon={Crown}
                  title="Bireysel Yıllık"
                  subtitle="En uygun fiyat"
                  price="₺3.490"
                  priceSuffix="/yıl"
                  helper="≈ ₺291/ay"
                  features={[
                    "Aylık planın tüm özellikleri",
                    "Yıllık ~%17 indirim",
                  ]}
                  actionLabel="Yıllık Premium"
                  actionIcon={Zap}
                  onClick={() => handlePayTRCheckout("individual", "yearly")}
                  loading={loadingPlan === "individual-yearly"}
                  disabled={!!loadingPlan || subLoading}
                  delay={0.3}
                  isCurrent={isIndividualPremium}
                  currentLabel="Aboneliği Yönet"
                />
              </div>

              {/* Comparison */}
              <motion.div className="max-w-3xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">
                  Plan <span className="text-primary">Karşılaştırma</span>
                </h2>
                <div className="glass rounded-2xl overflow-hidden border border-border">
                  <div className="grid grid-cols-3 gap-0 border-b border-border bg-secondary/30">
                    <div className="p-4 text-sm font-medium text-muted-foreground">Özellik</div>
                    <div className="p-4 text-sm font-medium text-muted-foreground text-center">Ücretsiz</div>
                    <div className="p-4 text-sm font-medium text-primary text-center flex items-center justify-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" /> Premium
                    </div>
                  </div>
                  {individualRows.map((row, i) => (
                    <div key={i} className={`grid grid-cols-3 gap-0 ${i < individualRows.length - 1 ? "border-b border-border/50" : ""}`}>
                      <div className="p-4 flex items-center gap-2 text-sm text-foreground">
                        <row.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        {row.feature}
                      </div>
                      <div className="p-4 flex items-center justify-center">
                        {typeof row.free === "boolean"
                          ? (row.free ? <Check className="w-4 h-4 text-primary" /> : <X className="w-4 h-4 text-muted-foreground/40" />)
                          : <span className="text-sm text-muted-foreground">{row.free}</span>}
                      </div>
                      <div className="p-4 flex items-center justify-center">
                        {typeof row.premium === "boolean"
                          ? (row.premium ? <Check className="w-4 h-4 text-primary" /> : <X className="w-4 h-4 text-muted-foreground/40" />)
                          : <span className="text-sm font-medium text-primary">{row.premium}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            /* Kurumsal */
            <>
              {/* If user has no approved inquiry → show başvuru CTA */}
              {!pendingInquiry && !isCorporatePremium && (
                <motion.div
                  className="max-w-2xl mx-auto mb-10 glass rounded-2xl p-6 border border-border text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Headphones className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground mb-2">
                    Önce Kurumsal Başvuru Yapın
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Kurumsal Premium aboneliği için önce başvuru formunu doldurun. Ekibimiz başvurunuzu inceleyip onayladıktan sonra ödemeyi yapabilir, kurumsal panele erişim sağlayabilirsiniz.
                  </p>
                  <button
                    onClick={handleCorporateContact}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                  >
                    <Send className="w-4 h-4" /> Başvuru Yap
                  </button>
                </motion.div>
              )}

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Kurumsal Aylık */}
                <PriceCard
                  accent
                  badge="ÖNERİLEN"
                  icon={Building2}
                  title="Kurumsal Aylık"
                  subtitle="Şirket ve filolar için"
                  price="₺500"
                  priceSuffix="/ay"
                  features={[
                    "Sınırsız araç kaydı",
                    "Kurumsal yönetim paneli",
                    "Toplu QR kod oluşturma",
                    "Filo istatistikleri & raporlama",
                    "Süresiz QR kodlar",
                    "Öncelikli destek",
                  ]}
                  actionLabel={pendingInquiry ? "Şimdi Öde" : "Önce Başvuru Yap"}
                  actionIcon={pendingInquiry ? Zap : Send}
                  onClick={() => pendingInquiry ? handlePayTRCheckout("corporate", "monthly") : handleCorporateContact()}
                  loading={loadingPlan === "corporate-monthly"}
                  disabled={!!loadingPlan || subLoading}
                  delay={0.2}
                  isCurrent={isCorporatePremium}
                  currentLabel="Kurumsal Aktif"
                />

                {/* Kurumsal Yıllık */}
                <PriceCard
                  badge="%17 TASARRUF"
                  icon={Building2}
                  title="Kurumsal Yıllık"
                  subtitle="En uygun yıllık plan"
                  price="₺4.990"
                  priceSuffix="/yıl"
                  helper="≈ ₺416/ay"
                  features={[
                    "Aylık planın tüm özellikleri",
                    "Yıllık ~%17 indirim",
                    "Yıllık fatura kolaylığı",
                  ]}
                  actionLabel={pendingInquiry ? "Şimdi Öde" : "Önce Başvuru Yap"}
                  actionIcon={pendingInquiry ? Zap : Send}
                  onClick={() => pendingInquiry ? handlePayTRCheckout("corporate", "yearly") : handleCorporateContact()}
                  loading={loadingPlan === "corporate-yearly"}
                  disabled={!!loadingPlan || subLoading}
                  delay={0.3}
                  isCurrent={isCorporatePremium}
                  currentLabel="Kurumsal Aktif"
                />
              </div>

              {/* Feature highlights */}
              <motion.div
                className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { icon: InfinityIcon, title: "Sınırsız Araç", desc: "Filonuzdaki tüm araçlar" },
                  { icon: BarChart3, title: "Detaylı Raporlar", desc: "Filo geneli istatistikler" },
                  { icon: Shield, title: "Öncelikli Destek", desc: "Kurumsal müşteri desteği" },
                ].map((item, i) => (
                  <div key={i} className="glass rounded-xl p-4 border border-border">
                    <item.icon className="w-5 h-5 text-primary mb-2" />
                    <h4 className="text-sm font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>

      <PayTRModal token={paytrToken} onClose={() => setPaytrToken(null)} />
      <Footer />
    </div>
  );
};

export default Pricing;
