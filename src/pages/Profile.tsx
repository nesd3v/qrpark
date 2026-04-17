import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User, Phone, Save, ChevronRight, Pencil, X,
  HelpCircle, Shield, FileText,
  MessageCircle, LogOut, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import DeleteAccountDialog from "@/components/shared/DeleteAccountDialog";

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isPremium, planType, subscriptionEnd } = useSubscription();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/profile");
      return;
    }
    if (user) fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (profileData) {
      setFullName(profileData.full_name || "");
      const rawPhone = profileData.phone || "";
      setPhone(formatPhone(rawPhone));
    }
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
  const daysLeft = subscriptionEnd
    ? Math.max(0, Math.ceil((new Date(subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* PROFILE HEADER */}
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

        {/* PREMIUM STATUS */}
        <motion.button
          onClick={() => navigate(isPremium ? "/subscription" : "/pricing")}
          className={`w-full rounded-2xl border overflow-hidden text-left p-4 flex items-center gap-3 transition-colors ${
            isPremium
              ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
              : "border-border bg-card hover:bg-secondary/30"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isPremium ? "bg-primary/15" : "bg-muted"
          }`}>
            <Crown className={`w-5 h-5 ${isPremium ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              {isPremium
                ? `Premium ${planType === "yearly" ? "Yıllık" : planType === "corporate" ? "Kurumsal" : "Aylık"}`
                : "Ücretsiz Plan"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPremium && daysLeft !== null
                ? `${daysLeft} gün kaldı`
                : "Premium'a yükseltin"}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* EDIT PROFILE */}
        <motion.div
          className="rounded-2xl bg-card border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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

        {/* SUPPORT */}
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
          ].map((item) => (
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

        {/* ACCOUNT */}
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
            <DeleteAccountDialog isPremium={isPremium} userEmail={user?.email || ""} />
          </div>
        </motion.div>

        <div className="h-4" />
      </div>
    </AppLayout>
  );
};

export default Profile;
