import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Loader2,
  ParkingCircle, Lightbulb, AlertTriangle, Wind,
  MoreHorizontal, CircleSlash, CarFront,
  DoorOpen, Siren, ShieldAlert, Fuel, Car,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

const issueIcons: Record<string, { icon: typeof ParkingCircle; color: string; bg: string; label: string }> = {
  "wrong-park": { icon: ParkingCircle, label: "Hatalı Park", color: "text-destructive", bg: "bg-destructive/10" },
  "double-park": { icon: CircleSlash, label: "Çift Sıra Park", color: "text-destructive", bg: "bg-destructive/10" },
  "blocking": { icon: CarFront, label: "Yol Kapatmış", color: "text-destructive", bg: "bg-destructive/10" },
  "lights-on": { icon: Lightbulb, label: "Farlar Açık", color: "text-warning", bg: "bg-warning/10" },
  "window-open": { icon: Wind, label: "Cam Açık", color: "text-info", bg: "bg-info/10" },
  "door-open": { icon: DoorOpen, label: "Kapı Açık", color: "text-info", bg: "bg-info/10" },
  "trunk-open": { icon: Car, label: "Bagaj Açık", color: "text-info", bg: "bg-info/10" },
  "alarm": { icon: Siren, label: "Alarm Çalıyor", color: "text-warning", bg: "bg-warning/10" },
  "damaged": { icon: AlertTriangle, label: "Araç Hasarlı", color: "text-destructive", bg: "bg-destructive/10" },
  "flat-tire": { icon: ShieldAlert, label: "Lastik Patlak", color: "text-warning", bg: "bg-warning/10" },
  "handbrake": { icon: Car, label: "El Freni Çekilmemiş", color: "text-destructive", bg: "bg-destructive/10" },
  "fuel-leak": { icon: Fuel, label: "Yakıt/Sıvı Sızıntısı", color: "text-destructive", bg: "bg-destructive/10" },
  "tow-needed": { icon: Car, label: "Çekilmesi Gerekiyor", color: "text-destructive", bg: "bg-destructive/10" },
  "other": { icon: MoreHorizontal, label: "Diğer", color: "text-primary", bg: "bg-primary/10" },
};

type VehicleNotification = {
  id: string;
  plate: string;
  issue_type: string;
  note: string | null;
  status: string;
  created_at: string;
};

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [vehicleNotifications, setVehicleNotifications] = useState<VehicleNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/messages");
      return;
    }
    if (user) fetchVehicleNotifications();
  }, [user, authLoading]);

  const fetchVehicleNotifications = async () => {
    setLoading(true);
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("plate")
      .eq("user_id", user!.id);

    if (vehicles && vehicles.length > 0) {
      const plates = vehicles.map((v) => v.plate);
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .in("plate", plates)
        .order("created_at", { ascending: false })
        .limit(100);
      setVehicleNotifications((data as VehicleNotification[]) || []);
    }
    setLoading(false);
  };

  // Realtime for vehicle notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-notifs")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      }, () => {
        fetchVehicleNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} sa önce`;
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  if (authLoading || loading) {
    return (
      <AppLayout title="Bildirimler">
        <div className="flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Bildirimler">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {vehicleNotifications.length === 0 ? (
          <motion.div
            className="rounded-xl bg-card border border-border p-10 text-center"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-display font-bold text-foreground mb-1">Bildirim yok</h2>
            <p className="text-sm text-muted-foreground">
              Aracınız hakkında bir bildirim geldiğinde burada görünecek.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {vehicleNotifications.map((notif, index) => {
              const info = issueIcons[notif.issue_type] || issueIcons["other"];
              const Icon = info.icon;
              return (
                <motion.div
                  key={notif.id}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className={`w-10 h-10 rounded-lg ${info.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${info.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{info.label}</p>
                      <span className="text-[10px] text-muted-foreground">{notif.plate}</span>
                    </div>
                    {notif.note && (
                      <p className="text-xs text-muted-foreground mt-1 bg-secondary/50 rounded-lg px-2 py-1">
                        {notif.note}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">{formatDate(notif.created_at)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Messages;
