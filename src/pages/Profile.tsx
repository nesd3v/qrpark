import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User, Phone, Save, CheckCircle2, ChevronRight, Pencil, X,
  Bell, BellRing, Package, Truck, HelpCircle, Shield, FileText,
  MessageCircle, Trash2, LogOut, MapPin, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import DeleteAccountDialog from "@/components/shared/DeleteAccountDialog";

type StickerOrder = {
  id: string;
  status: string;
  plate: string;
  created_at: string;
  address: string | null;
};

const statusMap: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: "Sipariş Alındı", color: "text-yellow-400", icon: Clock },
  preparing: { label: "Hazırlanıyor", color: "text-blue-400", icon: Package },
  shipped: { label: "Kargoda", color: "text-primary", icon: Truck },
  delivered: { label: "Teslim Edildi", color: "text-primary", icon: CheckCircle2 },
};

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [stickerOrders, setStickerOrders] = useState<StickerOrder[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/profile");
      return;
    }
    if (user) fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    const [profileRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("user_id", user!.id).maybeSingle(),
      supabase.from("sticker_orders").select("id, status, plate, created_at, address").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
    ]);

    if (profileRes.data) {
      setFullName(profileRes.data.full_name || "");
      const rawPhone = profileRes.data.phone || "";
      setPhone(formatPhone(rawPhone));
    }
    setStickerOrders((ordersRes.data as StickerOrder[]) || []);
    setLoading(false);
  };

  const formatPhone = (ph: string) => {
    const digits = ph.replace(/\D/g, "");
    let d = digits;
    if (d.startsWith("90") && d.length >= 12) d = d.slice(2);
    else if (d.startsWith("0") && d.length === 11) d = d.slice(1);
    let formatted = "+90 ";
    if (d.length > 0) formatted += d.slice(0, 3);
    if (d.length > 3) formatted += " " + d.slice(3, 6);
    if (d.length > 6) formatted += " " + d.slice(6, 8);
    if (d.length > 8) formatted += " " + d.slice(8, 10);
    return formatted.trim();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Profil güncellendi!");
      setEditMode(false);
    } catch (err: any) {
      toast.error(err.message || "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSettings = () => {
    // Try to open app notification settings on native
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            toast.success("Bildirimler açıldı!");
            // Send a test notification
            new Notification("QRPark", { body: "Bildirimler başarıyla açıldı! 🎉", icon: "/pwa-192x192.png" });
          } else {
            toast.info("Bildirimleri açmak için tarayıcı ayarlarından izin verin");
          }
        });
      } else if (Notification.permission === "granted") {
        toast.info("Bildirimler zaten açık");
        new Notification("QRPark", { body: "Bildirimleriniz aktif 🔔", icon: "/pwa-192x192.png" });
      } else {
        toast.info("Bildirimleri açmak için tarayıcı/telefon ayarlarına gidin");
      }
    } else {
      toast.info("Bu cihaz bildirimleri desteklemiyor");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const userInitial = fullName?.charAt(0)?.toUpperCase() || "?";

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* ===== PROFILE HEADER ===== */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-xl font-display font-bold text-primary-foreground shadow-lg flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-foreground truncate">
              {fullName || "Kullanıcı"}
            </h1>
            <p className="text-sm text-muted-foreground truncate">{phone || "Telefon eklenmedi"}</p>
          </div>
        </motion.div>

        {/* ===== PROFILI DÜZENLE ===== */}
        <motion.div
          className="rounded-2xl bg-card border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <button
            onClick={() => setEditMode(!editMode)}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Profili Düzenle</span>
            </div>
            <motion.div animate={{ rotate: editMode ? 45 : 0 }} transition={{ duration: 0.2 }}>
              {editMode ? <X className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
            </motion.div>
          </button>

          {editMode && (
            <motion.div
              className="px-4 pb-4 space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Ad Soyad
                </Label>
                <Input
                  placeholder="Adınız Soyadınız"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-secondary/50 border-border"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Telefon Numarası
                </Label>
                <Input
                  placeholder="+90 5XX XXX XX XX"
                  value={phone}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith("+90")) val = "+90 " + val.replace(/^\+?9?0?\s*/, "");
                    const afterPrefix = val.slice(3).replace(/[^\d\s]/g, "");
                    const digits = afterPrefix.replace(/\s/g, "");
                    let formatted = "+90 ";
                    if (digits.length > 0) formatted += digits.slice(0, 3);
                    if (digits.length > 3) formatted += " " + digits.slice(3, 6);
                    if (digits.length > 6) formatted += " " + digits.slice(6, 8);
                    if (digits.length > 8) formatted += " " + digits.slice(8, 10);
                    setPhone(formatted);
                  }}
                  className="bg-secondary/50 border-border tracking-wide"
                  maxLength={17}
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full gradient-primary text-primary-foreground font-semibold rounded-xl"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Kaydediliyor...
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* ===== STICKER SİPARİŞ TAKİBİ ===== */}
        <motion.div
          className="rounded-2xl bg-card border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Sticker Sipariş Takibi</span>
          </div>

          {stickerOrders.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Henüz sipariş yok</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stickerOrders.map((order) => {
                const status = statusMap[order.status] || statusMap.pending;
                const StatusIcon = status.icon;
                return (
                  <div key={order.id} className="flex items-center gap-3 p-4">
                    <StatusIcon className={`w-5 h-5 ${status.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{order.plate}</p>
                      <p className={`text-xs ${status.color}`}>{status.label}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ===== PUSH BİLDİRİMLERİ ===== */}
        <motion.div
          className="rounded-2xl bg-card border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={handleNotificationSettings}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BellRing className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium text-foreground block">Push Bildirimleri</span>
                <span className="text-[11px] text-muted-foreground">
                  {"Notification" in window && Notification.permission === "granted"
                    ? "Bildirimler açık"
                    : "Bildirimleri aç"}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* ===== DESTEK ===== */}
        <motion.div
          className="rounded-2xl bg-card border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Destek</span>
          </div>

          {[
            { icon: MessageCircle, label: "Bize Ulaşın", action: () => navigate("/messages") },
            { icon: Shield, label: "Gizlilik Politikası", action: () => navigate("/privacy") },
            { icon: FileText, label: "Şartlar ve Koşullar", action: () => navigate("/terms") },
            { icon: HelpCircle, label: "Yardım Merkezi", action: () => navigate("/help") },
          ].map((item, i) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30 transition-colors border-b border-border last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* ===== HESAP ===== */}
        <motion.div
          className="rounded-2xl bg-card border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors border-b border-border"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Çıkış Yap</span>
          </button>

          <div className="px-4 py-3.5">
            <DeleteAccountDialog isPremium={false} userEmail={user?.email || ""} />
          </div>
        </motion.div>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </AppLayout>
  );
};

export default Profile;
