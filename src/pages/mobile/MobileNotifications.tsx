import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell, Car, ParkingCircle, Lightbulb, AlertTriangle, Wind, MoreHorizontal,
  CircleSlash, CarFront, DoorOpen, Siren, ShieldAlert, Fuel, Crown, Lock, ChevronDown,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { haptic } from "@/hooks/useNative";

const issueIcons: Record<string, { icon: typeof ParkingCircle; color: string; bg: string; label: string }> = {
  "wrong-park": { icon: ParkingCircle, label: "Hatalı Park", color: "text-destructive", bg: "bg-destructive/10" },
  "double-park": { icon: CircleSlash, label: "Çift Sıra", color: "text-destructive", bg: "bg-destructive/10" },
  "blocking": { icon: CarFront, label: "Yol Kapatmış", color: "text-destructive", bg: "bg-destructive/10" },
  "lights-on": { icon: Lightbulb, label: "Farlar Açık", color: "text-warning", bg: "bg-warning/10" },
  "window-open": { icon: Wind, label: "Cam Açık", color: "text-info", bg: "bg-info/10" },
  "door-open": { icon: DoorOpen, label: "Kapı Açık", color: "text-info", bg: "bg-info/10" },
  "trunk-open": { icon: Car, label: "Bagaj Açık", color: "text-info", bg: "bg-info/10" },
  "alarm": { icon: Siren, label: "Alarm", color: "text-warning", bg: "bg-warning/10" },
  "damaged": { icon: AlertTriangle, label: "Hasarlı", color: "text-destructive", bg: "bg-destructive/10" },
  "flat-tire": { icon: ShieldAlert, label: "Lastik Patlak", color: "text-warning", bg: "bg-warning/10" },
  "handbrake": { icon: Car, label: "El Freni", color: "text-destructive", bg: "bg-destructive/10" },
  "fuel-leak": { icon: Fuel, label: "Sızıntı", color: "text-destructive", bg: "bg-destructive/10" },
  "tow-needed": { icon: Car, label: "Çekilmeli", color: "text-destructive", bg: "bg-destructive/10" },
  "other": { icon: MoreHorizontal, label: "Diğer", color: "text-primary", bg: "bg-primary/10" },
};

type Vehicle = { id: string; plate: string };
type Notification = { id: string; plate: string; issue_type: string; note: string | null; status: string; created_at: string };

const FREE_LIMIT = 5;

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}g önce`;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
};

const MobileNotifications = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/notifications");
      return;
    }
    if (user) loadVehicles();
  }, [user, authLoading]);

  useEffect(() => {
    if (selected) loadNotifications(selected.id);
  }, [selected]);

  const loadVehicles = async () => {
    const { data } = await supabase
      .from("vehicles")
      .select("id, plate")
      .eq("user_id", user!.id)
      .order("created_at");
    const list = (data as Vehicle[]) || [];
    setVehicles(list);
    if (list.length > 0) setSelected(list[0]);
    else setLoading(false);
  };

  const loadNotifications = async (vehicleId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false });
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  const visible = isPremium ? notifications : notifications.slice(0, FREE_LIMIT);
  const hidden = !isPremium && notifications.length > FREE_LIMIT ? notifications.length - FREE_LIMIT : 0;

  return (
    <MobileLayout title="Bildirimler">
      {vehicles.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-muted items-center justify-center mb-3">
            <Car className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-bold mb-1">Henüz aracın yok</p>
          <p className="text-sm text-muted-foreground mb-4">İlk aracını kaydet ve bildirim al</p>
          <button
            onClick={() => navigate("/generate")}
            className="px-6 h-12 rounded-2xl bg-primary text-primary-foreground font-bold active:scale-[0.98] transition-transform"
          >
            Araç Ekle
          </button>
        </div>
      ) : (
        <>
          {vehicles.length > 1 && (
            <>
              <button
                onClick={() => { haptic.light(); setShowSelector((s) => !s); }}
                className="w-full p-3 mb-3 rounded-2xl bg-card border border-border flex items-center gap-3 active:bg-muted/30"
              >
                <Car className="w-4 h-4 text-primary" />
                <span className="flex-1 text-left font-display font-bold text-foreground tracking-wider">{selected?.plate}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showSelector ? "rotate-180" : ""}`} />
              </button>
              {showSelector && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5 mb-3">
                  {vehicles.filter((v) => v.id !== selected?.id).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { haptic.light(); setSelected(v); setShowSelector(false); }}
                      className="w-full p-3 rounded-xl bg-card border border-border flex items-center gap-3 active:bg-muted/30"
                    >
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span className="font-display font-bold text-foreground tracking-wider">{v.plate}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </>
          )}

          {/* Counter */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-display font-bold text-foreground">Geçmiş</h2>
            <span className="text-xs text-muted-foreground">{notifications.length} bildirim</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">Henüz bildirim yok</p>
              <p className="text-xs text-muted-foreground mt-1">QR kodun tarandığında bildirimler burada görünür</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((n, i) => {
                const meta = issueIcons[n.issue_type] ?? issueIcons.other;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.2) }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border"
                  >
                    <div className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(n.created_at)}</p>
                    </div>
                  </motion.div>
                );
              })}

              {hidden > 0 && (
                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full p-4 rounded-2xl bg-gradient-to-br from-primary/15 to-transparent border border-primary/30 flex items-center gap-3 active:scale-[0.98] transition-transform"
                >
                  <Lock className="w-5 h-5 text-primary" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-foreground">{hidden} bildirim daha gizli</p>
                    <p className="text-xs text-muted-foreground">Premium ile tüm geçmişi gör</p>
                  </div>
                  <Crown className="w-4 h-4 text-primary" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </MobileLayout>
  );
};

export default MobileNotifications;
