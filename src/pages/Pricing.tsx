import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Car, Bell, QrCode, Shield, Zap, Headphones, Building2, Users, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PayTRModal from "@/components/subscription/PayTRModal";

const features = [
  { icon: Car, text: "Sınırsız araç kaydı" },
  { icon: QrCode, text: "Sınırsız QR kod oluşturma" },
  { icon: Bell, text: "Anlık SMS bildirim" },
  { icon: Zap, text: "QR otomatik yenileme" },
  { icon: Shield, text: "Reklamsız deneyim" },
  { icon: Headphones, text: "Öncelikli destek" },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [paytrToken, setPaytrToken] = useState<string | null>(null);
  const [corpOpen, setCorpOpen] = useState(false);
  const [corpSubmitting, setCorpSubmitting] = useState(false);
  const [corpForm, setCorpForm] = useState({
    company_name: "",
    contact_email: "",
    contact_phone: "",
    vehicle_count: "",
    message: "",
  });

  const handleSubscribe = async (planType: "monthly" | "yearly") => {
    if (!user) {
      navigate("/auth?redirect=/pricing");
      return;
    }
    setLoading(planType);
    try {
      const { data, error } = await supabase.functions.invoke("create-paytr-token", {
        body: { planType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.token) {
        setPaytrToken(data.token);
      }
    } catch (err: any) {
      toast.error(err.message || "Ödeme başlatılamadı");
    } finally {
      setLoading(null);
    }
  };

  const handleCorporateSubmit = async () => {
    if (!corpForm.company_name.trim() || !corpForm.contact_email.trim() || !corpForm.contact_phone.trim() || !corpForm.vehicle_count) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    setCorpSubmitting(true);
    try {
      const { error } = await supabase.from("corporate_inquiries").insert({
        company_name: corpForm.company_name.trim(),
        contact_email: corpForm.contact_email.trim(),
        contact_phone: corpForm.contact_phone.trim(),
        vehicle_count: parseInt(corpForm.vehicle_count, 10) || 1,
        message: corpForm.message.trim() || null,
        plan_type: "filo",
        user_id: user?.id ?? null,
      });
      if (error) throw error;
      toast.success("Talebiniz alındı! En kısa sürede sizinle iletişime geçeceğiz.");
      setCorpOpen(false);
      setCorpForm({ company_name: "", contact_email: "", contact_phone: "", vehicle_count: "", message: "" });
    } catch (err: any) {
      toast.error(err.message || "Talep gönderilemedi");
    } finally {
      setCorpSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Size Uygun <span className="text-primary">Plan</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Bireysel kullanıcılar ve filo sahipleri için esnek planlar
            </p>
          </motion.div>

          {/* Individual plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
            {/* Monthly */}
            <motion.div
              className="glass rounded-2xl p-8 border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-foreground text-lg">Aylık</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">₺49</span>
                <span className="text-muted-foreground"> / ay</span>
              </div>
              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe("monthly")}
                disabled={loading !== null}
                className="w-full bg-secondary text-foreground hover:bg-secondary/80 font-semibold"
              >
                {loading === "monthly" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {user ? "Aboneliği Başlat" : "Giriş Yap ve Başla"}
              </Button>
            </motion.div>

            {/* Yearly - Most Popular */}
            <motion.div
              className="glass rounded-2xl p-8 border-2 border-primary relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                EN POPÜLER · %15 İNDİRİM
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-foreground text-lg">Yıllık</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">₺499</span>
                <span className="text-muted-foreground"> / yıl</span>
                <p className="text-xs text-muted-foreground mt-1">≈ ₺41.50 / ay</p>
              </div>
              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe("yearly")}
                disabled={loading !== null}
                className="w-full gradient-primary text-primary-foreground hover:opacity-90 font-semibold"
              >
                {loading === "yearly" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {user ? "Aboneliği Başlat" : "Giriş Yap ve Başla"}
              </Button>
            </motion.div>
          </div>

          {/* Corporate plan */}
          <motion.div
            className="max-w-3xl mx-auto glass rounded-2xl p-8 border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground text-xl mb-1">Kurumsal · Filo</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  10+ araçlı filolar için özel pano, toplu araç yönetimi ve detaylı raporlar
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> Sınırsız kullanıcı</span>
                  <span className="inline-flex items-center gap-1"><Car className="w-3 h-3" /> Toplu araç içe aktarma</span>
                  <span className="inline-flex items-center gap-1"><Headphones className="w-3 h-3" /> Özel destek hattı</span>
                </div>
              </div>
              <Button
                onClick={() => setCorpOpen(true)}
                className="gradient-primary text-primary-foreground font-semibold w-full md:w-auto"
              >
                Talep Oluştur
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Corporate inquiry dialog */}
      <Dialog open={corpOpen} onOpenChange={setCorpOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Kurumsal Talep Formu
            </DialogTitle>
            <DialogDescription>
              Talebinizi inceleyip 1 iş günü içinde size geri döneceğiz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Şirket Adı *</Label>
              <Input value={corpForm.company_name} onChange={(e) => setCorpForm({ ...corpForm, company_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">İletişim E-postası *</Label>
              <Input type="email" value={corpForm.contact_email} onChange={(e) => setCorpForm({ ...corpForm, contact_email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">İletişim Telefonu *</Label>
              <Input value={corpForm.contact_phone} onChange={(e) => setCorpForm({ ...corpForm, contact_phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Araç Sayısı *</Label>
              <Input type="number" min="1" value={corpForm.vehicle_count} onChange={(e) => setCorpForm({ ...corpForm, vehicle_count: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mesajınız</Label>
              <Textarea rows={3} value={corpForm.message} onChange={(e) => setCorpForm({ ...corpForm, message: e.target.value })} />
            </div>
            <Button onClick={handleCorporateSubmit} disabled={corpSubmitting} className="w-full gradient-primary text-primary-foreground font-semibold">
              {corpSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Gönder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PayTRModal token={paytrToken} onClose={() => setPaytrToken(null)} />

      <Footer />
    </div>
  );
};

export default Pricing;
