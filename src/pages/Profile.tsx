import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Car, Phone, Save, CheckCircle2, Crown, Plus, Trash2, Lock, Shield, Settings, MessageSquare, PhoneCall, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";

type Vehicle = { id: string; plate: string; phone: string; sms_enabled: boolean; call_enabled: boolean };

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const isOAuthUser = user?.app_metadata?.provider !== "email" && user?.app_metadata?.provider !== undefined;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/profile");
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (profileData) {
      setFullName(profileData.full_name || "");
    } else {
      await supabase.from("profiles").insert({ user_id: user!.id, full_name: "" });
    }

    const { data: vehicleData } = await supabase
      .from("vehicles")
      .select("id, plate, phone, sms_enabled, call_enabled")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });

    const allVehicles = (vehicleData as Vehicle[]) || [];
    setVehicles(allVehicles);

    const phoneMap: Record<string, string> = {};
    allVehicles.forEach((v) => {
      let ph = v.phone || "";
      // Format existing phones for display
      const digits = ph.replace(/\D/g, "");
      let d = digits;
      if (d.startsWith("90") && d.length >= 12) d = d.slice(2);
      else if (d.startsWith("0") && d.length === 11) d = d.slice(1);
      let formatted = "+90 ";
      if (d.length > 0) formatted += d.slice(0, 3);
      if (d.length > 3) formatted += " " + d.slice(3, 6);
      if (d.length > 6) formatted += " " + d.slice(6, 8);
      if (d.length > 8) formatted += " " + d.slice(8, 10);
      phoneMap[v.id] = formatted;
    });
    setPhones(phoneMap);

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
        .eq("user_id", user!.id);

      if (profileError) throw profileError;

      for (const v of vehicles) {
        const newPhone = phones[v.id]?.trim();
        if (newPhone && newPhone !== v.phone) {
          const { error: vehicleError } = await supabase
            .from("vehicles")
            .update({ phone: newPhone })
            .eq("id", v.id);

          if (vehicleError) throw vehicleError;
        }
      }

      setSaved(true);
      toast.success("Profil güncellendi!");
      setTimeout(() => setSaved(false), 2000);
      await fetchProfile();
    } catch (err: any) {
      toast.error(err.message || "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Şifre en az 8 karakter olmalıdır");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Şifreniz başarıyla değiştirildi!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Şifre değiştirilemedi");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (vehicles.length <= 1) {
      toast.error("En az bir aracınız olmalıdır");
      return;
    }

    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicleId);

      if (error) throw error;

      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      toast.success("Araç silindi");
    } catch (err: any) {
      toast.error(err.message || "Araç silinemedi");
    }
  };

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

  const userInitial = fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <motion.div className="max-w-lg mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            
            {/* Profile Header with Avatar */}
            <div className="text-center mb-10">
              <motion.div
                className="relative w-20 h-20 mx-auto mb-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-2xl font-display font-bold text-primary-foreground shadow-lg">
                  {userInitial}
                </div>
                {isPremium && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-primary fill-primary/20" />
                  </div>
                )}
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">
                <span className="text-primary">Profil</span> Ayarları
              </h1>
              <p className="text-muted-foreground text-sm">Hesap ve araç bilgilerinizi yönetin</p>
              {isPremium && (
                <motion.div
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Crown className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">Premium Üye</span>
                </motion.div>
              )}
            </div>

            {/* Personal Info Card */}
            <motion.div
              className="glass rounded-2xl p-6 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-base font-display font-bold text-foreground">Kişisel Bilgiler</h2>
              </div>

              <div className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Ad Soyad
                  </Label>
                  <Input
                    placeholder="Adınız Soyadınız"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                    maxLength={100}
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    E-posta
                  </Label>
                  <div className="relative">
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="bg-secondary/30 border-border text-muted-foreground cursor-not-allowed pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Vehicles Card */}
            <motion.div
              className="glass rounded-2xl p-6 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Car className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-base font-display font-bold text-foreground">Araçlarım</h2>
                  {isPremium && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      PREMIUM
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {vehicles.length} araç
                </span>
              </div>

              <div className="space-y-3">
                {vehicles.map((v, index) => (
                  <motion.div
                    key={v.id}
                    className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/20 transition-colors space-y-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Car className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-display font-bold text-foreground tracking-wider text-sm">
                          {v.plate}
                        </span>
                      </div>
                      {isPremium && vehicles.length > 1 && (
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
                          title="Aracı sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Telefon Numarası
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">🇹🇷</span>
                        <Input
                          placeholder="5XX XXX XX XX"
                          value={phones[v.id] || "+90 "}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith("+90")) {
                              val = "+90 " + val.replace(/^\+?9?0?\s*/, "");
                            }
                            const afterPrefix = val.slice(3).replace(/[^\d\s]/g, "");
                            const digits = afterPrefix.replace(/\s/g, "");
                            let formatted = "+90 ";
                            if (digits.length > 0) formatted += digits.slice(0, 3);
                            if (digits.length > 3) formatted += " " + digits.slice(3, 6);
                            if (digits.length > 6) formatted += " " + digits.slice(6, 8);
                            if (digits.length > 8) formatted += " " + digits.slice(8, 10);
                            setPhones((prev) => ({ ...prev, [v.id]: formatted }));
                          }}
                          className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-9 text-sm focus:border-primary/50 transition-colors pl-8 tracking-wide"
                          maxLength={17}
                        />
                      </div>
                    </div>

                    {/* SMS & Call Toggles */}
                    <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-2 flex-1">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">SMS</span>
                        <Switch
                          checked={v.sms_enabled}
                          onCheckedChange={async (checked) => {
                            await supabase.from("vehicles").update({ sms_enabled: checked }).eq("id", v.id);
                            setVehicles((prev) => prev.map((veh) => veh.id === v.id ? { ...veh, sms_enabled: checked } : veh));
                            toast.success(checked ? "SMS bildirimleri açıldı" : "SMS bildirimleri kapatıldı");
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <PhoneCall className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Arama</span>
                        <Switch
                          checked={v.call_enabled}
                          onCheckedChange={async (checked) => {
                            await supabase.from("vehicles").update({ call_enabled: checked }).eq("id", v.id);
                            setVehicles((prev) => prev.map((veh) => veh.id === v.id ? { ...veh, call_enabled: checked } : veh));
                            toast.success(checked ? "Arama bildirimleri açıldı" : "Arama bildirimleri kapatıldı");
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Add vehicle info */}
                {!isPremium && vehicles.length >= 1 && (
                  <motion.div
                    className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-dashed border-border"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Birden fazla araç eklemek için{" "}
                        <Link to="/pricing" className="text-primary font-semibold hover:underline">
                          Premium'a geçin →
                        </Link>
                      </p>
                    </div>
                  </motion.div>
                )}

                {isPremium && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link
                      to="/generate"
                      className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-primary/30 text-sm font-medium text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      QR sayfasından yeni araç ekle
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40 rounded-xl"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Kaydediliyor...
                  </span>
                ) : saved ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Kaydedildi!
                  </span>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </Button>
            </motion.div>

            {/* Delete Account */}
            <motion.div
              className="flex justify-center pt-6 pb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <DeleteAccountDialog isPremium={isPremium} userEmail={user?.email || ""} />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
