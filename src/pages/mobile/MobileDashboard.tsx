import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Car, QrCode, Bell, Crown, Plus, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaytrCheckoutHandler } from "@/hooks/usePaytrCheckoutHandler";
import MobileLayout from "@/components/layout/MobileLayout";

type Vehicle = { id: string; plate: string; brand: string | null; model: string | null };

const MobileDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = useSubscription();
  usePaytrCheckoutHandler();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const { data: v } = await supabase
        .from("vehicles")
        .select("id, plate, brand, model")
        .eq("user_id", user.id)
        .order("created_at");
      const list = (v as Vehicle[]) || [];
      setVehicles(list);

      if (list.length > 0) {
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .in("vehicle_id", list.map((x) => x.id));
        setNotifCount(count || 0);
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <MobileLayout title="QRPark">
        <div className="flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title={`Merhaba${user?.user_metadata?.full_name ? ", " + user.user_metadata.full_name.split(" ")[0] : ""} 👋`}
      rightAction={
        <Link
          to="/pricing"
          className={`p-2 rounded-full ${isPremium ? "text-yellow-500" : "text-muted-foreground"}`}
        >
          <Crown className="w-5 h-5" />
        </Link>
      }
    >
      {/* Hero Premium card */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-5 mb-4 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Premium'a Geç</h3>
              <p className="text-xs text-muted-foreground">Sınırsız araç, süresiz QR</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/pricing")}
            className="w-full mt-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
          >
            Planları Gör
          </button>
        </motion.div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-card border border-border p-4"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Car className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{vehicles.length}</p>
          <p className="text-xs text-muted-foreground">Araç</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border border-border p-4"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{notifCount}</p>
          <p className="text-xs text-muted-foreground">Bildirim</p>
        </motion.div>
      </div>

      {/* Vehicles section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-display font-bold text-foreground">Araçlarım</h2>
        <Link to="/generate" className="text-xs font-medium text-primary flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Yeni
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <button
          onClick={() => navigate("/generate")}
          className="w-full p-6 rounded-2xl border-2 border-dashed border-border flex flex-col items-center gap-2 active:bg-muted/30"
        >
          <QrCode className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">İlk QR'ını oluştur</span>
        </button>
      ) : (
        <div className="space-y-2.5">
          {vehicles.map((v, i) => (
            <motion.button
              key={v.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => navigate(`/profile`)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border active:scale-[0.98] transition-transform"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-display font-bold text-foreground tracking-wider truncate">{v.plate}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {v.brand && v.model ? `${v.brand} ${v.model}` : "Araç"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </MobileLayout>
  );
};

export default MobileDashboard;
