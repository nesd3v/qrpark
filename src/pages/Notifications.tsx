import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, ParkingCircle, Lightbulb, AlertTriangle, Wind,
  MoreHorizontal, CheckCircle2, XCircle, CircleSlash, CarFront,
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

type Notification = {
  id: string; plate: string; issue_type: string; note: string | null; status: string; created_at: string;
};

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/notifications");
      return;
    }
    if (user) fetchNotifications();
  }, [user, authLoading]);

  const fetchNotifications = async () => {
    setLoading(true);
    // Get user's vehicles first
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
      setNotifications((data as Notification[]) || []);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün önce`;
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  };

  if (authLoading || loading) {
    return (
      <AppLayout title="Bildirimler">
        <div className="flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Bildirimler">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <motion.h1
          className="text-xl font-display font-bold text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Bildirimler
        </motion.h1>

        {notifications.length === 0 ? (
          <motion.div
            className="rounded-2xl bg-card border border-border p-10 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Henüz bildirim yok</p>
            <p className="text-xs text-muted-foreground mt-1">
              Aracınız hakkında bir bildirim geldiğinde burada görünecek.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, index) => {
              const info = issueIcons[notif.issue_type] || issueIcons["other"];
              const Icon = info.icon;
              return (
                <motion.div
                  key={notif.id}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.03 }}
                >
                  <div className={`w-10 h-10 rounded-lg ${info.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${info.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{info.label}</p>
                      {notif.status === "sent" ? (
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.plate}</p>
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

export default Notifications;
