import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Car, Plus, Download, RefreshCw, Crown, ChevronDown, Phone, ShieldCheck, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import MobileLayout from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { haptic } from "@/hooks/useNative";

import { translateError } from "@/lib/translateError";
type Vehicle = {
  id: string;
  plate: string;
  phone: string;
  last_qr_generated_at: string | null;
  verification_status: string;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const MobileGenerateQR = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Add vehicle
  const [showAdd, setShowAdd] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [newPhone, setNewPhone] = useState("+90 ");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/generate");
      return;
    }
    if (user) fetchVehicles();
  }, [user, authLoading]);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vehicles")
      .select("id, plate, phone, last_qr_generated_at, verification_status")
      .eq("user_id", user!.id)
      .order("created_at");
    const list = (data as Vehicle[]) || [];
    setVehicles(list);
    if (list.length > 0) setSelected(list[0]);
    setLoading(false);
  };

  const formatPhone = (val: string) => {
    if (!val.startsWith("+90")) val = "+90 " + val.replace(/^\+?9?0?\s*/, "");
    const digits = val.slice(3).replace(/\D/g, "");
    let f = "+90 ";
    if (digits.length > 0) f += digits.slice(0, 3);
    if (digits.length > 3) f += " " + digits.slice(3, 6);
    if (digits.length > 6) f += " " + digits.slice(6, 8);
    if (digits.length > 8) f += " " + digits.slice(8, 10);
    return f;
  };

  const canRegenerate = () => {
    if (isPremium) return true;
    if (!selected?.last_qr_generated_at) return true;
    return Date.now() - new Date(selected.last_qr_generated_at).getTime() >= WEEK_MS;
  };

  const handleAddVehicle = async () => {
    if (!newPlate.trim()) { toast.error("Plaka gerekli"); return; }
    if (newPhone.replace(/\D/g, "").length < 12) { toast.error("Geçerli telefon girin"); return; }
    setAdding(true);
    haptic.light();
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          plate: newPlate.trim().toUpperCase(),
          phone: newPhone.trim(),
          user_id: user!.id,
          verification_status: "verified", // SMS-based verification, no ruhsat needed
        })
        .select("id, plate, phone, last_qr_generated_at, verification_status")
        .single();
      if (error) {
        if (error.code === "23505") { toast.error("Bu plaka zaten kayıtlı"); return; }
        throw error;
      }
      const v = data as Vehicle;
      setVehicles((prev) => [...prev, v]);
      setSelected(v);
      setShowAdd(false);
      setNewPlate("");
      setNewPhone("+90 ");
      haptic.success();
      toast.success("Araç kaydedildi");
    } catch (err: any) {
      haptic.error();
      toast.error(translateError(err, "Bir hata oluştu"));
    } finally {
      setAdding(false);
    }
  };

  const handleGenerate = async () => {
    if (!selected) return;
    if (!canRegenerate()) {
      const days = Math.ceil((WEEK_MS - (Date.now() - new Date(selected.last_qr_generated_at!).getTime())) / (24 * 60 * 60 * 1000));
      toast.error(`${days} gün sonra yenileyebilirsin`);
      haptic.error();
      return;
    }
    setRegenerating(true);
    haptic.light();
    try {
      const now = new Date().toISOString();
      const expiresAt = isPremium ? null : new Date(Date.now() + WEEK_MS).toISOString();
      const { error } = await supabase
        .from("vehicles")
        .update({ last_qr_generated_at: now, qr_expires_at: expiresAt })
        .eq("id", selected.id);
      if (error) throw error;
      const updated = { ...selected, last_qr_generated_at: now };
      setSelected(updated);
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      haptic.success();
      toast.success("QR kodun hazır!");
    } catch (err: any) {
      haptic.error();
      toast.error(translateError(err, "Bir hata oluştu"));
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || !selected) return;
    haptic.light();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    canvas.width = 600; canvas.height = 600;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 600, 600);
      const link = document.createElement("a");
      link.download = `qrpark-${selected.plate}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("İndirildi");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };

  const notifyUrl = selected ? `${window.location.origin}/notify/${encodeURIComponent(selected.plate)}` : "";
  const generated = !!selected?.last_qr_generated_at;

  if (authLoading || loading) {
    return (
      <MobileLayout title="QR Kod">
        <div className="flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  // Add vehicle screen
  if (showAdd || vehicles.length === 0) {
    return (
      <MobileLayout title="Araç Ekle" showBack={vehicles.length > 0} rightAction={null}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
          <div className="text-center mb-6">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-3">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground">Aracını kaydet</h2>
            <p className="text-sm text-muted-foreground mt-1">Plaka ve telefon bilgilerini gir</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-card border border-border px-4 py-3 focus-within:border-primary/60 transition-colors">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Plaka</div>
              <input
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                placeholder="34 ABC 123"
                className="w-full bg-transparent text-foreground outline-none text-lg font-display tracking-widest"
                maxLength={15}
              />
            </div>

            <div className="rounded-2xl bg-card border border-border px-4 py-3 focus-within:border-primary/60 transition-colors">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Telefon</div>
              <input
                inputMode="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(formatPhone(e.target.value))}
                placeholder="+90 5XX XXX XX XX"
                className="w-full bg-transparent text-foreground outline-none text-base tracking-wide"
                maxLength={17}
              />
            </div>
          </div>

          <button
            onClick={handleAddVehicle}
            disabled={adding}
            className="w-full mt-6 h-14 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Aracı Kaydet
          </button>

          {vehicles.length > 0 && (
            <button
              onClick={() => setShowAdd(false)}
              className="w-full mt-3 h-12 rounded-2xl bg-muted text-foreground font-medium active:scale-[0.98] transition-transform"
            >
              İptal
            </button>
          )}
        </motion.div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title="QR Kod"
      rightAction={
        <button
          onClick={() => { haptic.light(); setShowAdd(true); }}
          className="p-2 rounded-full active:bg-muted/40 text-primary"
          aria-label="Yeni araç"
        >
          <Plus className="w-5 h-5" />
        </button>
      }
    >
      {/* Vehicle selector */}
      <button
        onClick={() => { haptic.light(); setShowSelector((s) => !s); }}
        className="w-full p-4 rounded-2xl bg-card border border-border flex items-center gap-3 active:bg-muted/30 mb-4"
      >
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Car className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-display font-bold text-foreground tracking-wider">{selected?.plate}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3" />{selected?.phone}
          </p>
        </div>
        {vehicles.length > 1 && <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showSelector ? "rotate-180" : ""}`} />}
      </button>

      {showSelector && vehicles.length > 1 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mb-4">
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

      {/* QR Display */}
      <div className="rounded-3xl bg-card border border-border p-6 text-center mb-4">
        {generated ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div ref={qrRef} className="inline-block bg-white p-4 rounded-2xl mb-4">
              <QRCodeSVG value={notifyUrl} size={220} bgColor="#ffffff" fgColor="#000000" level="H" />
            </div>
            <p className="text-xs text-muted-foreground break-all px-4">{notifyUrl}</p>
            {!isPremium && selected?.last_qr_generated_at && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Son geçerlilik: 7 gün
              </p>
            )}
          </motion.div>
        ) : (
          <div className="py-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-3">
              <RefreshCw className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-bold mb-1">QR oluştur</p>
            <p className="text-xs text-muted-foreground">Aracın için QR kod oluşturmaya hazır</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          onClick={handleGenerate}
          disabled={regenerating}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {regenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          {generated ? "Yeniden Oluştur" : "QR Oluştur"}
        </button>

        {generated && (
          <button
            onClick={handleDownload}
            className="w-full h-12 rounded-2xl bg-card border border-border text-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Download className="w-4 h-4" />
            İndir
          </button>
        )}
      </div>

      {!isPremium && (
        <button
          onClick={() => navigate("/pricing")}
          className="w-full mt-4 p-4 rounded-2xl bg-gradient-to-br from-primary/15 to-transparent border border-primary/30 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <Crown className="w-5 h-5 text-primary" />
          <div className="text-left flex-1">
            <p className="text-sm font-bold text-foreground">Süresiz QR + Sınırsız yenileme</p>
            <p className="text-xs text-muted-foreground">Premium'a geç</p>
          </div>
        </button>
      )}
    </MobileLayout>
  );
};

export default MobileGenerateQR;
