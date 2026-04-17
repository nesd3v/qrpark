import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Car, Plus, Pencil, Trash2, ChevronLeft, Loader2, QrCode,
  CheckCircle2, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import AppLayout from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const CAR_BRANDS: Record<string, string[]> = {
  "TOGG": ["T10X", "T10F"],
  "Toyota": ["Corolla", "Yaris", "C-HR", "RAV4", "Camry", "Land Cruiser", "Hilux", "Supra", "Aygo X", "Yaris Cross"],
  "Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "T-Roc", "T-Cross", "Arteon", "ID.4", "ID.3", "Taigo", "Caddy"],
  "BMW": ["3 Serisi", "5 Serisi", "X1", "X3", "X5", "1 Serisi", "4 Serisi", "7 Serisi", "iX", "i4"],
  "Mercedes-Benz": ["A Serisi", "C Serisi", "E Serisi", "S Serisi", "GLA", "GLC", "GLE", "CLA", "EQA", "EQC", "Vito"],
  "Audi": ["A3", "A4", "A6", "Q3", "Q5", "Q7", "A1", "Q2", "e-tron", "A5", "RS3"],
  "Ford": ["Focus", "Fiesta", "Puma", "Kuga", "Ranger", "Transit", "Mustang", "Explorer", "Tourneo"],
  "Renault": ["Clio", "Megane", "Captur", "Kadjar", "Taliant", "Austral", "Kangoo", "Arkana"],
  "Fiat": ["Egea", "500", "500X", "Panda", "Tipo", "Doblo", "Fiorino", "500L"],
  "Hyundai": ["i20", "i30", "Tucson", "Kona", "Bayon", "Santa Fe", "IONIQ 5", "i10", "Elantra"],
  "Kia": ["Ceed", "Sportage", "Stonic", "Picanto", "Niro", "Sorento", "EV6", "XCeed", "Rio"],
  "Peugeot": ["208", "308", "2008", "3008", "5008", "508", "Rifter", "Partner", "e-208"],
  "Citroën": ["C3", "C4", "C5 Aircross", "Berlingo", "C3 Aircross", "C4 X", "ë-C4"],
  "Opel": ["Corsa", "Astra", "Mokka", "Crossland", "Grandland", "Combo", "Insignia"],
  "Škoda": ["Octavia", "Fabia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Scala", "Enyaq"],
  "Seat": ["Leon", "Ibiza", "Arona", "Ateca", "Tarraco"],
  "Cupra": ["Formentor", "Born", "Leon", "Ateca"],
  "Dacia": ["Sandero", "Duster", "Jogger", "Spring", "Logan"],
  "Volvo": ["XC40", "XC60", "XC90", "S60", "V60", "C40", "S90"],
  "Nissan": ["Qashqai", "Juke", "X-Trail", "Micra", "Leaf", "Ariya"],
  "Honda": ["Civic", "HR-V", "CR-V", "Jazz", "ZR-V", "e:Ny1"],
  "Mazda": ["CX-5", "CX-30", "3", "CX-60", "MX-5", "CX-3"],
  "Mitsubishi": ["ASX", "Eclipse Cross", "Outlander", "L200", "Space Star"],
  "Suzuki": ["Vitara", "S-Cross", "Swift", "Jimny", "Ignis"],
  "Jeep": ["Renegade", "Compass", "Avenger", "Wrangler", "Grand Cherokee"],
  "Land Rover": ["Defender", "Discovery Sport", "Range Rover Evoque", "Range Rover Sport", "Range Rover"],
  "Porsche": ["Cayenne", "Macan", "Taycan", "911", "Panamera"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X"],
  "MG": ["ZS", "HS", "4", "Marvel R", "5"],
  "Chery": ["Tiggo 4 Pro", "Tiggo 7 Pro", "Tiggo 8 Pro", "Omoda 5", "Arrizo 6"],
};

const CAR_COLORS = [
  { value: "beyaz", label: "Beyaz", hex: "#FFFFFF" },
  { value: "siyah", label: "Siyah", hex: "#1a1a1a" },
  { value: "gri", label: "Gri", hex: "#808080" },
  { value: "gumus", label: "Gümüş", hex: "#C0C0C0" },
  { value: "kirmizi", label: "Kırmızı", hex: "#DC2626" },
  { value: "mavi", label: "Mavi", hex: "#2563EB" },
  { value: "lacivert", label: "Lacivert", hex: "#1E3A5F" },
  { value: "yesil", label: "Yeşil", hex: "#16A34A" },
  { value: "kahverengi", label: "Kahverengi", hex: "#8B4513" },
  { value: "turuncu", label: "Turuncu", hex: "#EA580C" },
  { value: "sari", label: "Sarı", hex: "#EAB308" },
  { value: "bordo", label: "Bordo", hex: "#7F1D1D" },
  { value: "bej", label: "Bej", hex: "#D4C5A9" },
];

type Vehicle = {
  id: string;
  plate: string;
  phone: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  last_qr_generated_at: string | null;
  verification_status: string;
};

const GenerateQR = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form state
  const [formBrand, setFormBrand] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formPlate, setFormPlate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/generate");
      return;
    }
    if (user) {
      fetchVehicles();
    }
    // Check for payment result in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success("Ödeme başarılı! Premium üyeliğiniz aktif edildi 🎉");
      window.history.replaceState({}, "", "/generate");
    } else if (params.get("checkout") === "failed") {
      toast.error("Ödeme başarısız oldu. Lütfen tekrar deneyin.");
      window.history.replaceState({}, "", "/generate");
    }
  }, [user, authLoading]);

  const fetchVehicles = async () => {
    setLoadingVehicle(true);
    const { data } = await supabase
      .from("vehicles")
      .select("id, plate, phone, brand, model, color, last_qr_generated_at, verification_status")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });
    setVehicles((data as Vehicle[]) || []);
    setLoadingVehicle(false);
  };

  const resetForm = () => {
    setFormBrand(""); setFormModel(""); setFormColor(""); setFormPlate("");
    setEditingVehicle(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormBrand(v.brand || "");
    setFormModel(v.model || "");
    setFormColor(v.color || "");
    setFormPlate(v.plate);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formPlate.trim()) { toast.error("Plaka gerekli"); return; }
    if (!formBrand) { toast.error("Marka seçin"); return; }
    if (!formModel) { toast.error("Model seçin"); return; }
    if (!formColor) { toast.error("Renk seçin"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("user_id", user!.id)
      .single();
    const userPhone = profile?.phone || "";

    setSaving(true);
    try {
      if (editingVehicle) {
        const { error } = await supabase.from("vehicles").update({
          plate: formPlate.trim().toUpperCase(),
          brand: formBrand, model: formModel, color: formColor,
        }).eq("id", editingVehicle.id);
        if (error) throw error;
        toast.success("Araç güncellendi");
      } else {
        const { data, error } = await supabase.from("vehicles").insert({
          plate: formPlate.trim().toUpperCase(),
          phone: userPhone,
          brand: formBrand, model: formModel, color: formColor,
          user_id: user!.id,
          verification_status: "verified",
        }).select("id, plate, phone, brand, model, color, last_qr_generated_at, verification_status").single();
        if (error) {
          if (error.code === "23505") { toast.error("Bu plaka zaten kayıtlı"); setSaving(false); return; }
          throw error;
        }

        const now = new Date().toISOString();
        const qrExpiresAt = new Date(Date.now() + WEEK_MS).toISOString();
        await supabase.from("vehicles").update({ last_qr_generated_at: now, qr_expires_at: qrExpiresAt }).eq("id", data.id);

        toast.success("Araç kaydedildi ve QR oluşturuldu!");
      }
      setModalOpen(false);
      resetForm();
      await fetchVehicles();
    } catch (err: any) {
      toast.error(err.message || "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu aracı silmek istediğinize emin misiniz?")) return;
    setDeleting(id);
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) toast.error("Silinemedi");
    else {
      toast.success("Araç silindi");
      if (selectedVehicle?.id === id) setSelectedVehicle(null);
      await fetchVehicles();
    }
    setDeleting(null);
  };

  const notifyUrl = (plate: string) => `${window.location.origin}/notify/${encodeURIComponent(plate)}`;

  const colorLabel = (val: string | null) => CAR_COLORS.find(c => c.value === val)?.label || val || "";
  const colorHex = (val: string | null) => CAR_COLORS.find(c => c.value === val)?.hex || "#ccc";

  if (authLoading || loadingVehicle) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  // ========== VEHICLE DETAIL VIEW ==========
  if (selectedVehicle) {
    const v = selectedVehicle;
    const hasQR = !!v.last_qr_generated_at;

    return (
      <AppLayout>
        <div className="py-6">
          <div className="max-w-lg mx-auto px-4">
            <motion.div className="max-w-lg mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={() => setSelectedVehicle(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ChevronLeft className="w-4 h-4" /> Araçlarıma Dön
              </button>

              <div className="glass rounded-2xl p-8 border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Car className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-display font-bold text-foreground tracking-wider">{v.plate}</h1>
                    <p className="text-sm text-muted-foreground">
                      {v.brand} {v.model}
                      {v.color && (
                        <span className="inline-flex items-center gap-1 ml-2">
                          <span className="w-3 h-3 rounded-full border border-border inline-block" style={{ backgroundColor: colorHex(v.color) }} />
                          {colorLabel(v.color)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                  <div className="bg-secondary rounded-lg px-3 py-2">
                    <p className="text-muted-foreground text-xs">Telefon</p>
                    <p className="text-foreground font-medium">{v.phone}</p>
                  </div>
                  <div className="bg-secondary rounded-lg px-3 py-2">
                    <p className="text-muted-foreground text-xs">Marka / Model</p>
                    <p className="text-foreground font-medium">{v.brand} {v.model}</p>
                  </div>
                </div>

                {hasQR && (
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                      <CheckCircle2 className="w-4 h-4" /> QR Kodunuz Aktif
                    </div>

                    <div ref={qrRef} className="p-6 rounded-xl bg-[#e8ecf0]">
                      <QRCodeSVG
                        value={notifyUrl(v.plate)}
                        size={200}
                        bgColor="#e8ecf0"
                        fgColor="#0a0f1a"
                        level="H"
                      />
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      QR kodunu telefonunuzdan göstererek veya cam kenarına asarak kullanabilirsiniz
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => openEditModal(v)}>
                    <Pencil className="w-4 h-4 mr-1.5" /> Düzenle
                  </Button>
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => handleDelete(v.id)} disabled={deleting === v.id}>
                    {deleting === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ========== VEHICLE LIST VIEW ==========
  return (
    <AppLayout>
      <div className="py-6">
        <div className="max-w-lg mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Araçlarım</h1>
                <p className="text-sm text-muted-foreground">Kayıtlı araçlarınızı yönetin</p>
              </div>
              <Button onClick={openAddModal} size="sm" className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1.5" /> Ekle
              </Button>
            </div>

            {vehicles.length === 0 ? (
              <div className="glass rounded-2xl p-10 border border-border text-center">
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Car className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-display font-bold text-foreground mb-1">Henüz Araç Yok</h3>
                <p className="text-sm text-muted-foreground mb-5">İlk aracınızı ekleyin ve QR kodunuzu oluşturun</p>
                <Button onClick={openAddModal} className="gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-1.5" /> Araç Ekle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className="w-full glass rounded-xl p-4 border border-border hover:border-primary/30 transition-colors text-left flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-foreground tracking-wider">{v.plate}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.brand} {v.model}
                        {v.color && (
                          <span className="inline-flex items-center gap-1 ml-2">
                            <span className="w-2.5 h-2.5 rounded-full border border-border inline-block" style={{ backgroundColor: colorHex(v.color) }} />
                            {colorLabel(v.color)}
                          </span>
                        )}
                      </p>
                    </div>
                    {v.last_qr_generated_at && (
                      <QrCode className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Premium upsell */}
            <motion.div
              className="mt-6 glass rounded-2xl p-5 border border-primary/20 bg-primary/5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-foreground text-sm">Premium'a Geç</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">Sınırsız araç, gelişmiş bildirim ve öncelikli destek</p>
                  <Button
                    onClick={() => navigate("/pricing")}
                    size="sm"
                    className="gradient-primary text-primary-foreground"
                  >
                    Planları İncele
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Add/Edit Vehicle Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              {editingVehicle ? "Aracı Düzenle" : "Araç Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Plaka *</Label>
              <Input
                placeholder="34 ABC 123"
                value={formPlate}
                onChange={(e) => setFormPlate(e.target.value.toUpperCase())}
                className="font-display tracking-wider"
                maxLength={10}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Marka *</Label>
              <Select value={formBrand} onValueChange={(v) => { setFormBrand(v); setFormModel(""); }}>
                <SelectTrigger><SelectValue placeholder="Marka seçin" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {Object.keys(CAR_BRANDS).sort().map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Model *</Label>
              <Select value={formModel} onValueChange={setFormModel} disabled={!formBrand}>
                <SelectTrigger><SelectValue placeholder={formBrand ? "Model seçin" : "Önce marka seçin"} /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {(CAR_BRANDS[formBrand] || []).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Renk *</Label>
              <Select value={formColor} onValueChange={setFormColor}>
                <SelectTrigger><SelectValue placeholder="Renk seçin" /></SelectTrigger>
                <SelectContent>
                  {CAR_COLORS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground font-semibold py-5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingVehicle ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default GenerateQR;
