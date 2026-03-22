import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Car,
  ParkingCircle,
  Lightbulb,
  AlertTriangle,
  Wind,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  Crown,
  BarChart3,
  Lock,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import DashboardCharts from "@/components/DashboardCharts";

const issueIcons: Record<string, { icon: typeof ParkingCircle; color: string; bg: string; label: string }> = {
  "wrong-park": { icon: ParkingCircle, label: "Hatalı Park", color: "text-destructive", bg: "bg-destructive/10" },
  "lights-on": { icon: Lightbulb, label: "Farlar Açık", color: "text-warning", bg: "bg-warning/10" },
  "damaged": { icon: AlertTriangle, label: "Araç Hasarlı", color: "text-destructive", bg: "bg-destructive/10" },
  "window-open": { icon: Wind, label: "Cam Açık", color: "text-info", bg: "bg-info/10" },
  "other": { icon: MoreHorizontal, label: "Diğer", color: "text-primary", bg: "bg-primary/10" },
};

type Vehicle = { id: string; plate: string; phone: string };

type Notification = {
  id: string;
  plate: string;
  issue_type: string;
  note: string | null;
  status: string;
  created_at: string;
};

const FREE_NOTIFICATION_LIMIT = 5;

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/dashboard");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedVehicle) return;

    const channel = supabase
      .channel("dashboard-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `plate=eq.${selectedVehicle.plate}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          toast.info("Yeni bir bildirim alındı!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedVehicle]);

  const fetchData = async () => {
    setLoading(true);

    const { data: vehicleData } = await supabase
      .from("vehicles")
      .select("id, plate, phone")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });

    const allVehicles = (vehicleData as Vehicle[]) || [];
    
    // OAuth users without vehicles → redirect to onboarding
    if (allVehicles.length === 0) {
      navigate("/onboarding");
      return;
    }

    setVehicles(allVehicles);

    const active = allVehicles[0] || null;
    setSelectedVehicle(active);

    if (active) {
      await fetchNotifications(active.plate);
    }

    // Fetch all notifications across all vehicles for charts
    if (allVehicles.length > 0) {
      const plates = allVehicles.map((v) => v.plate);
      const { data: allNotifData } = await supabase
        .from("notifications")
        .select("*")
        .in("plate", plates)
        .order("created_at", { ascending: false });
      setAllNotifications((allNotifData as Notification[]) || []);
    }

    setLoading(false);
  };

  const fetchNotifications = async (plate: string) => {
    const { data: notifData } = await supabase
      .from("notifications")
      .select("*")
      .eq("plate", plate)
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifications((notifData as Notification[]) || []);
  };

  const handleSelectVehicle = async (v: Vehicle) => {
    setSelectedVehicle(v);
    setShowVehicleSelector(false);
    await fetchNotifications(v.plate);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStats = () => {
    const total = notifications.length;
    const thisMonth = notifications.filter((n) => {
      const d = new Date(n.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const typeCounts: Record<string, number> = {};
    notifications.forEach((n) => {
      typeCounts[n.issue_type] = (typeCounts[n.issue_type] || 0) + 1;
    });
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    const topLabel = topType ? (issueIcons[topType[0]]?.label || "Diğer") : "-";

    return { total, thisMonth, topLabel };
  };

  const visibleNotifications = isPremium
    ? notifications
    : notifications.slice(0, FREE_NOTIFICATION_LIMIT);
  const hiddenCount = isPremium ? 0 : Math.max(0, notifications.length - FREE_NOTIFICATION_LIMIT);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <motion.div className="max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                Bildirim <span className="text-primary">Paneli</span>
              </h1>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {/* Vehicle selector */}
                {vehicles.length > 1 ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowVehicleSelector(!showVehicleSelector)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Car className="w-4 h-4 text-primary" />
                      <span className="font-display font-bold text-foreground tracking-wider">
                        {selectedVehicle?.plate}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <AnimatePresence>
                      {showVehicleSelector && (
                        <motion.div
                          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-10 glass rounded-xl border border-border p-2 min-w-[180px]"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          {vehicles.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => handleSelectVehicle(v)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-display tracking-wider transition-colors ${
                                selectedVehicle?.id === v.id
                                  ? "bg-primary/10 text-primary font-bold"
                                  : "text-foreground hover:bg-secondary"
                              }`}
                            >
                              {v.plate}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : selectedVehicle ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="font-display font-bold text-foreground tracking-wider">{selectedVehicle.plate}</span>
                  </div>
                ) : null}

                {isPremium ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                    <Crown className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold text-primary">PREMIUM</span>
                  </div>
                ) : (
                  <Link to="/pricing" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border hover:border-primary/30 transition-colors">
                    <Crown className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Premium'a Geç</span>
                  </Link>
                )}

                {isPremium && vehicles.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {vehicles.length} araç kayıtlı
                  </div>
                )}
              </div>
            </div>

            {/* Stats Section */}
            {isPremium ? (
              <motion.div
                className="grid grid-cols-3 gap-3 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="glass rounded-xl p-4 text-center">
                  <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-[11px] text-muted-foreground">Toplam Bildirim</p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <Bell className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{stats.thisMonth}</p>
                  <p className="text-[11px] text-muted-foreground">Bu Ay</p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <AlertTriangle className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground mt-1">{stats.topLabel}</p>
                  <p className="text-[11px] text-muted-foreground">En Sık Sorun</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="glass rounded-xl p-4 mb-6 flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">İstatistikler Premium'a özel</p>
                  <p className="text-xs text-muted-foreground">Bildirim istatistiklerini görmek için Premium'a geçin</p>
                </div>
                <Link to="/pricing">
                  <span className="text-xs font-bold text-primary hover:underline">Geç →</span>
                </Link>
              </motion.div>
            )}

            {/* Charts - Premium only */}
            {isPremium && notifications.length > 0 && (
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DashboardCharts
                  notifications={notifications}
                  vehiclePlates={vehicles.map((v) => v.plate)}
                  allNotifications={allNotifications}
                />
              </motion.div>
            )}

            {vehicles.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">Araç Bulunamadı</h2>
                <p className="text-muted-foreground text-sm">Hesabınıza bağlı bir araç kaydı bulunamadı.</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">Henüz Bildirim Yok</h2>
                <p className="text-muted-foreground text-sm">Aracınıza henüz bir bildirim gönderilmemiş.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  {isPremium ? (
                    <>Toplam <span className="text-foreground font-medium">{notifications.length}</span> bildirim</>
                  ) : (
                    <>Son <span className="text-foreground font-medium">{visibleNotifications.length}</span> / {notifications.length} bildirim</>
                  )}
                </p>

                {visibleNotifications.map((notif, index) => {
                  const issueInfo = issueIcons[notif.issue_type] || issueIcons["other"];
                  const Icon = issueInfo.icon;

                  return (
                    <motion.div
                      key={notif.id}
                      className="glass rounded-xl p-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-lg ${issueInfo.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${issueInfo.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-medium text-foreground">{issueInfo.label}</h3>
                            <div className="flex items-center gap-1.5">
                              {notif.status === "sent" ? (
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              ) : (
                                <XCircle className="w-4 h-4 text-destructive" />
                              )}
                              <span className={`text-xs ${notif.status === "sent" ? "text-primary" : "text-destructive"}`}>
                                {notif.status === "sent" ? "Gönderildi" : "Başarısız"}
                              </span>
                            </div>
                          </div>

                          {notif.note && (
                            <p className="text-sm text-muted-foreground mb-2">{notif.note}</p>
                          )}

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(notif.created_at)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {hiddenCount > 0 && (
                  <motion.div
                    className="glass rounded-xl p-5 text-center border border-dashed border-primary/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      +{hiddenCount} bildirim daha var
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Tüm bildirim geçmişinizi görmek için Premium'a geçin
                    </p>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      Premium'a Geç
                    </Link>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
