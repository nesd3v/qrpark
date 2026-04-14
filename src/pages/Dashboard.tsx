import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Car, ParkingCircle, Lightbulb, AlertTriangle, Wind,
  MoreHorizontal, Clock, CheckCircle2, XCircle, QrCode,
  CircleSlash, CarFront, DoorOpen, Siren, ShieldAlert, Fuel,
  MessageSquare, ScanLine, Plus, Package, Truck, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useIsMobileApp } from "@/hooks/useIsMobileApp";

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

type Vehicle = { id: string; plate: string; phone: string; brand?: string; model?: string };
type Notification = {
  id: string; plate: string; issue_type: string; note: string | null; status: string; created_at: string;
};
type StickerOrder = { id: string; status: string; plate: string };

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobileApp();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [profileName, setProfileName] = useState<string>("");
  const [stickerOrders, setStickerOrders] = useState<StickerOrder[]>([]);
  const [showStickerOrders, setShowStickerOrders] = useState(false);
  const [seenOrderCount, setSeenOrderCount] = useState<number>(0);
  

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/dashboard");
      return;
    }
    if (user) fetchData();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!selectedVehicle) return;
    const channel = supabase
      .channel("dashboard-notifications")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `plate=eq.${selectedVehicle.plate}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
        toast.info("Yeni bir bildirim alındı!");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedVehicle]);

  const fetchData = async () => {
    setLoading(true);

    const [vehicleRes, profileRes] = await Promise.all([
      supabase.from("vehicles").select("id, plate, phone, brand, model").eq("user_id", user!.id).order("created_at", { ascending: true }),
      supabase.from("profiles").select("full_name").eq("user_id", user!.id).single(),
    ]);

    const allVehicles = (vehicleRes.data as Vehicle[]) || [];
    setVehicles(allVehicles);
    setProfileName(profileRes.data?.full_name || user?.email?.split("@")[0] || "");

    const active = allVehicles[0] || null;
    setSelectedVehicle(active);

    if (active) {
      await fetchNotifications(active.plate);
    }

    // Fetch sticker orders
    const { data: orders } = await supabase
      .from("sticker_orders")
      .select("id, status, plate")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setStickerOrders((orders as StickerOrder[]) || []);

    // Load seen order count from localStorage
    const savedSeen = localStorage.getItem(`seen_order_count_${user!.id}`);
    setSeenOrderCount(savedSeen ? parseInt(savedSeen, 10) : 0);

    setLoading(false);
  };

  const fetchNotifications = async (plate: string) => {
    const { data } = await supabase.from("notifications").select("*").eq("plate", plate)
      .order("created_at", { ascending: false }).limit(50);
    setNotifications((data as Notification[]) || []);
  };

  const handleSelectVehicle = async (v: Vehicle) => {
    setSelectedVehicle(v);
    setShowVehicleSelector(false);
    await fetchNotifications(v.plate);
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
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  const hasPendingOrder = stickerOrders.some(o => o.status !== "delivered");

  const handleToggleStickerOrders = () => {
    setShowStickerOrders(!showStickerOrders);
    // Mark as seen
    const pending = stickerOrders.filter(o => o.status !== "delivered").length;
    localStorage.setItem(`seen_order_count_${user!.id}`, String(pending));
    setSeenOrderCount(pending);
  };

  if (authLoading || loading) {
    return (
      <AppLayout hideHeader>
        <div className="flex items-center justify-center pt-20">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const pendingOrderCount = stickerOrders.filter(o => o.status !== "delivered").length;
  const unseenOrderCount = Math.max(0, pendingOrderCount - seenOrderCount);

  const stickerStatusMap: Record<string, { label: string; color: string; icon: typeof Package }> = {
    pending: { label: "Sipariş Alındı", color: "text-yellow-400", icon: Clock },
    preparing: { label: "Hazırlanıyor", color: "text-blue-400", icon: Package },
    shipped: { label: "Kargoda", color: "text-primary", icon: Truck },
    delivered: { label: "Teslim Edildi", color: "text-primary", icon: CheckCircle2 },
  };

  const quickActions = [
    { icon: QrCode, label: "QR Göster", action: () => navigate("/generate"), color: "text-primary", badge: vehicles.length > 0 ? vehicles.length : null, pulse: false },
    { icon: Plus, label: "Araç Ekle", action: () => navigate("/generate"), color: "text-primary", badge: null, pulse: false },
    { icon: Bell, label: "Bildirimler", action: () => navigate("/messages"), color: "text-primary", badge: null, pulse: false },
    { icon: ScanLine, label: "QR Aktivasyon", action: () => navigate("/generate"), color: "text-primary", badge: null, pulse: true },
    { icon: Truck, label: "Sipariş Takibi", action: handleToggleStickerOrders, color: "text-primary", badge: unseenOrderCount > 0 ? unseenOrderCount : null, pulse: unseenOrderCount > 0 },
    { icon: Package, label: "Sticker Sipariş", action: () => navigate("/generate"), color: "text-primary", badge: null, pulse: false },
  ];

  return (
    <AppLayout hideHeader={isMobile}>
      {/* ===== TOP BAR (mobile only) ===== */}
      {isMobile && (
        <header className="sticky top-0 z-50 glass px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Car className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-bold text-foreground">
                QR<span className="text-primary">Park</span>
              </span>
            </div>
            <button
              onClick={() => navigate("/notifications")}
              className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>
          </div>
        </header>
      )}

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">

          {/* ===== GREETING ===== */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-muted-foreground text-sm">Merhaba,</p>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {profileName || "Kullanıcı"} 👋
            </h1>
          </motion.div>

          {/* ===== VEHICLE HERO CARD ===== */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {vehicles.length === 0 ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Car className="w-7 h-7 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-display font-bold text-foreground mb-1">Araç Ekleyin</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  İlk aracınızı ekleyerek QR kodunuzu oluşturun.
                </p>
                <button
                  onClick={() => navigate("/generate")}
                  className="w-full py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Araç Ekle
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {selectedVehicle?.brand} {selectedVehicle?.model}
                      </p>
                      <p className="font-display font-bold text-lg text-foreground tracking-wider">
                        {selectedVehicle?.plate}
                      </p>
                    </div>
                  </div>
                  {vehicles.length > 1 && (
                    <button
                      onClick={() => setShowVehicleSelector(!showVehicleSelector)}
                      className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      Değiştir <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showVehicleSelector && (
                    <motion.div
                      className="mt-2 space-y-1"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {vehicles.filter(v => v.id !== selectedVehicle?.id).map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleSelectVehicle(v)}
                          className="w-full text-left px-3 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary text-sm text-foreground font-display tracking-wider transition-colors"
                        >
                          {v.plate}
                          <span className="text-xs text-muted-foreground ml-2">{v.brand} {v.model}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{notifications.length}</p>
                    <p className="text-[10px] text-muted-foreground">Bildirim</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{vehicles.length}</p>
                    <p className="text-[10px] text-muted-foreground">Araç</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{stickerOrders.length}</p>
                    <p className="text-[10px] text-muted-foreground">Sipariş</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* ===== QUICK ACTIONS ===== */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-display font-semibold text-foreground mb-3">Hızlı İşlemler</h2>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((item, i) => (
                <motion.button
                  key={item.label}
                  onClick={item.action}
                  className="relative flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                  whileTap={{ scale: 0.93 }}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                >
                  {/* Badge */}
                  {item.badge !== null && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center px-1">
                      {item.badge}
                    </span>
                  )}
                  {/* Animated icon container */}
                  <motion.div
                    className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ${item.pulse ? "animate-pulse" : ""}`}
                    whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </motion.div>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ===== INLINE STICKER ORDERS ===== */}
          <AnimatePresence>
            {showStickerOrders && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Sipariş Takibi</span>
                </div>
                {stickerOrders.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Henüz sipariş yok</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {stickerOrders.map((order) => {
                      const status = stickerStatusMap[order.status] || stickerStatusMap.pending;
                      const StatusIcon = status.icon;
                      return (
                        <div key={order.id} className="flex items-center gap-3 p-4">
                          <StatusIcon className={`w-5 h-5 ${status.color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{order.plate}</p>
                            <p className={`text-xs ${status.color}`}>{status.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== RECENT NOTIFICATIONS ===== */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-display font-semibold text-foreground">Son Bildirimler</h2>
              {notifications.length > 3 && (
                <button className="text-xs text-primary font-medium">Tümünü Gör</button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="rounded-xl bg-card border border-border p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Henüz bildirim yok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 5).map((notif, index) => {
                  const info = issueIcons[notif.issue_type] || issueIcons["other"];
                  const Icon = info.icon;
                  return (
                    <motion.div
                      key={notif.id}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                    >
                      <div className={`w-10 h-10 rounded-lg ${info.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${info.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{info.label}</p>
                          <div className="flex items-center gap-1">
                            {notif.status === "sent" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-destructive" />
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(notif.created_at)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
    </AppLayout>
  );
};

export default Dashboard;
