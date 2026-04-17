import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  User, Car, Crown, ChevronRight, ChevronDown, LogOut, Trash2, Shield,
  FileText, MessageCircle, Mail, Phone as PhoneIcon, Bell, Settings, Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import MobileLayout from "@/components/layout/MobileLayout";
import DeleteAccountDialog from "@/components/shared/DeleteAccountDialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Vehicle = { id: string; plate: string; phone: string; sms_enabled: boolean; call_enabled: boolean };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 mb-2">{title}</h3>
    <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
      {children}
    </div>
  </div>
);

const Row = ({
  icon: Icon, label, sublabel, onClick, to, danger, right,
}: {
  icon: any; label: string; sublabel?: string; onClick?: () => void; to?: string; danger?: boolean; right?: React.ReactNode;
}) => {
  const content = (
    <div className={`flex items-center gap-3 px-4 py-3.5 active:bg-muted/40 transition-colors ${danger ? "text-destructive" : ""}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${danger ? "bg-destructive/10" : "bg-primary/10"}`}>
        <Icon className={`w-4 h-4 ${danger ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground truncate">{sublabel}</p>}
      </div>
      {right ?? <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
    </div>
  );
  if (to) return <Link to={to} className="block">{content}</Link>;
  return <button onClick={onClick} className="block w-full text-left">{content}</button>;
};

const MobileProfile = () => {
  const { user, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const [{ data: profile }, { data: v }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).maybeSingle(),
        supabase.from("vehicles").select("id, plate, phone, sms_enabled, call_enabled").eq("user_id", user.id).order("created_at"),
      ]);
      setFullName(profile?.full_name || "");
      setPhone(profile?.phone || user.user_metadata?.phone || "");
      setVehicles((v as Vehicle[]) || []);
      setLoading(false);
    })();
  }, [user, navigate]);

  const initial = (fullName?.charAt(0) || user?.email?.charAt(0) || "?").toUpperCase();

  return (
    <MobileLayout title="Profil">
      {/* Avatar header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center pt-2 pb-6"
      >
        <div className="relative w-20 h-20 mb-3">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-2xl font-display font-bold text-primary-foreground shadow-lg">
            {initial}
          </div>
          {isPremium && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-primary flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
        </div>
        <h2 className="text-lg font-display font-bold text-foreground">{fullName || "QRPark Kullanıcısı"}</h2>
        <p className="text-xs text-muted-foreground">{phone || user?.email}</p>
        {isPremium ? (
          <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Crown className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-bold text-primary">Premium Üye</span>
          </span>
        ) : (
          <Link to="/pricing" className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-foreground text-[11px] font-bold">
            <Crown className="w-3 h-3" /> Premium'a Geç
          </Link>
        )}
      </motion.div>

      {/* Hesap bilgileri */}
      <Section title="Hesap">
        <div className="px-4 py-3 space-y-3">
          <div>
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Ad Soyad</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={async () => {
                await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user!.id);
                toast.success("Kaydedildi");
              }}
              className="bg-secondary/50 border-border mt-1 h-10"
              placeholder="Adınız"
            />
          </div>
        </div>
      </Section>

      {/* Araçlarım - collapsible */}
      <div className="mb-5">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 mb-2">Araçlarım</h3>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setVehiclesOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/40"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Kayıtlı Araçlar</p>
              <p className="text-xs text-muted-foreground">{loading ? "Yükleniyor..." : `${vehicles.length} araç`}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${vehiclesOpen ? "rotate-180" : ""}`} />
          </button>

          {vehiclesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="border-t border-border"
            >
              {vehicles.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">Henüz araç eklemediniz</p>
              ) : (
                <div className="divide-y divide-border">
                  {vehicles.map((v) => (
                    <div key={v.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-display font-bold text-foreground tracking-wider text-sm">{v.plate}</p>
                        <span className="text-[10px] text-muted-foreground">{v.phone}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 flex-1 text-xs text-muted-foreground">
                          <Bell className="w-3 h-3" /> SMS
                          <Switch
                            checked={v.sms_enabled}
                            onCheckedChange={async (c) => {
                              await supabase.from("vehicles").update({ sms_enabled: c }).eq("id", v.id);
                              setVehicles((p) => p.map((x) => x.id === v.id ? { ...x, sms_enabled: c } : x));
                            }}
                          />
                        </label>
                        <label className="flex items-center gap-2 flex-1 text-xs text-muted-foreground">
                          <PhoneIcon className="w-3 h-3" /> Arama
                          <Switch
                            checked={v.call_enabled}
                            onCheckedChange={async (c) => {
                              await supabase.from("vehicles").update({ call_enabled: c }).eq("id", v.id);
                              setVehicles((p) => p.map((x) => x.id === v.id ? { ...x, call_enabled: c } : x));
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link
                to="/generate"
                className="block text-center py-3 border-t border-border text-sm font-medium text-primary active:bg-muted/40"
              >
                + Yeni araç ekle
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Abonelik */}
      <Section title="Abonelik">
        <Row icon={Crown} label="Aboneliğim" sublabel={isPremium ? "Premium aktif" : "Ücretsiz plan"} to="/subscription" />
        <Row icon={Settings} label="Bildirim Ayarları" to="/dashboard" />
      </Section>

      {/* Yasal & Destek */}
      <Section title="Yasal & Destek">
        <Row icon={MessageCircle} label="Bize Ulaşın" sublabel="Destek ekibimizle iletişim" to="/contact" />
        <Row icon={Shield} label="Gizlilik Politikası" to="/privacy" />
        <Row icon={FileText} label="Kullanım Şartları" to="/terms" />
        <Row icon={Lock} label="KVKK Aydınlatma Metni" to="/kvkk" />
      </Section>

      {/* Tehlikeli */}
      <Section title="Hesap İşlemleri">
        <Row icon={LogOut} label="Çıkış Yap" onClick={signOut} />
        <Row icon={Trash2} label="Hesabımı Sil" danger onClick={() => setDeleteOpen(true)} />
      </Section>

      <p className="text-center text-[10px] text-muted-foreground mt-6">QRPark v1.0.0</p>

      <DeleteAccountDialog
        isPremium={isPremium}
        userEmail={user?.email || ""}
        externalOpen={deleteOpen}
        onExternalOpenChange={setDeleteOpen}
      />
    </MobileLayout>
  );
};

export default MobileProfile;
