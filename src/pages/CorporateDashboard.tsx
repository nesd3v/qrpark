import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Building2, Car, Bell, Loader2, Users, ShieldCheck, Clock, BarChart3 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Membership = {
  id: string;
  company_name: string;
  plan_type: string;
  max_vehicles: number;
  is_active: boolean;
};

type Report = {
  totalVehicles: number;
  verified: number;
  pending: number;
  rejected: number;
  activeQr: number;
  expiredQr: number;
  totalNotifications: number;
  maxVehicles: number;
};

const CorporateDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/corporate-dashboard");
      return;
    }
    if (user) load();
  }, [user, authLoading]);

  const load = async () => {
    setLoading(true);
    try {
      const [check, rep] = await Promise.all([
        supabase.functions.invoke("corporate-dashboard", { body: { action: "check" } }),
        supabase.functions.invoke("corporate-dashboard", { body: { action: "report" } }),
      ]);
      if (check.error || check.data?.error) {
        toast.error("Kurumsal üyeliğiniz bulunamadı");
        navigate("/dashboard");
        return;
      }
      setMembership(check.data.membership);
      if (rep.data?.report) setReport(rep.data.report);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!membership) return null;

  const cards = [
    { label: "Toplam Araç", value: report?.totalVehicles ?? 0, icon: Car, sub: `Limit: ${membership.max_vehicles}` },
    { label: "Onaylı Araç", value: report?.verified ?? 0, icon: ShieldCheck },
    { label: "Bekleyen", value: report?.pending ?? 0, icon: Clock },
    { label: "Aktif QR", value: report?.activeQr ?? 0, icon: Car },
    { label: "Süresi Dolmuş QR", value: report?.expiredQr ?? 0, icon: Clock },
    { label: "Toplam Bildirim", value: report?.totalNotifications ?? 0, icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-primary font-bold">Kurumsal Filo</p>
                <h1 className="text-2xl font-display font-bold text-foreground">{membership.company_name}</h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-8">
              Plan: <span className="text-foreground font-semibold capitalize">{membership.plan_type}</span> · Maks. {membership.max_vehicles} araç
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {cards.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-card border border-border p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <c.icon className="w-5 h-5 text-primary" />
                    {c.sub && <span className="text-[10px] text-muted-foreground">{c.sub}</span>}
                  </div>
                  <p className="text-3xl font-bold text-foreground">{c.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="rounded-xl bg-card border border-border p-6">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-foreground">Filo Yönetimi</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Araçlarınızı yönetmek için araçlarım sayfasını kullanın. Toplu içe aktarma ve detaylı raporlar yakında eklenecek.
              </p>
              <button
                onClick={() => navigate("/generate")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
              >
                <Car className="w-4 h-4" /> Araçlara Git
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CorporateDashboard;
