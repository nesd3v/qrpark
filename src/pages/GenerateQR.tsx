import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Car, Plus, Pencil, Trash2, ChevronLeft, Loader2, QrCode,
  CheckCircle2, Package, Truck, MapPin, Clock, CreditCard,
  Monitor, Sticker, Shield, Zap, Sun, CloudRain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import AppLayout from "@/components/layout/AppLayout";
import PayTRModal from "@/components/subscription/PayTRModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ======= CAR DATA =======
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

  // Sticker order
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [stickerNote, setStickerNote] = useState("");
  const [orderingStickerFor, setOrderingStickerFor] = useState<Vehicle | null>(null);
  const [orderingSticker, setOrderingSticker] = useState(false);
  const [stickerStep, setStickerStep] = useState<"package" | "address" | "summary">("package");
  const [stickerPackage, setStickerPackage] = useState<1 | 2>(1);

  // Sticker codes for this user
  const [activatedStickers, setActivatedStickers] = useState<Record<string, boolean>>({});

  // Address form fields
  const [addrCity, setAddrCity] = useState("");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrNeighborhood, setAddrNeighborhood] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrBuildingNo, setAddrBuildingNo] = useState("");
  const [addrFloor, setAddrFloor] = useState("");
  const [addrApartment, setAddrApartment] = useState("");
  const [addrPostalCode, setAddrPostalCode] = useState("");

  // Order tracking
  const [stickerOrders, setStickerOrders] = useState<Record<string, any>>({});
  const [trackingVehicle, setTrackingVehicle] = useState<Vehicle | null>(null);

  // PayTR payment
  const [paytrToken, setPaytrToken] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/generate");
      return;
    }
    if (user) {
      fetchVehicles();
      fetchStickerOrders();
      fetchActivatedStickers();
    }
    // Check for payment result in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success("Ödeme başarılı! Sticker siparişiniz onaylandı 🎉");
      window.history.replaceState({}, "", "/generate");
    } else if (params.get("checkout") === "failed") {
      toast.error("Ödeme başarısız oldu. Lütfen tekrar deneyin.");
      window.history.replaceState({}, "", "/generate");
    }
  }, [user, authLoading]);

  const fetchActivatedStickers = async () => {
    const { data } = await supabase
      .from("sticker_codes")
      .select("vehicle_id")
      .eq("activated_by", user!.id)
      .eq("status", "activated");
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach((s: any) => { if (s.vehicle_id) map[s.vehicle_id] = true; });
      setActivatedStickers(map);
    }
  };

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

  const fetchStickerOrders = async () => {
    const { data } = await supabase
      .from("sticker_orders")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) {
      const map: Record<string, any> = {};
      data.forEach((o: any) => { if (!map[o.vehicle_id]) map[o.vehicle_id] = o; });
      setStickerOrders(map);
    }
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

    // Get user's phone from profile
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

        // Auto-generate QR with 7-day expiry
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

  const buildFullAddress = () => {
    const parts = [
      addrNeighborhood && `${addrNeighborhood} Mah.`,
      addrStreet && `${addrStreet}`,
      addrBuildingNo && `No: ${addrBuildingNo}`,
      addrFloor && `Kat: ${addrFloor}`,
      addrApartment && `Daire: ${addrApartment}`,
      addrDistrict,
      addrCity,
      addrPostalCode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const isAddressValid = () => {
    return addrCity.trim() && addrDistrict.trim() && addrNeighborhood.trim() && addrStreet.trim() && addrBuildingNo.trim();
  };

  const handleOrderSticker = async () => {
    if (!orderingStickerFor) return;
    const fullAddress = buildFullAddress();
    if (!fullAddress) { toast.error("Adres gerekli"); return; }
    setOrderingSticker(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-sticker-payment", {
        body: {
          vehicleId: orderingStickerFor.id,
          plate: orderingStickerFor.plate,
          address: fullAddress,
          note: stickerNote.trim() || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStickerModalOpen(false);
      setPaytrToken(data.token);
      toast.info("Ödeme sayfası açılıyor...");
    } catch (err: any) {
      toast.error(err.message || "Ödeme başlatılamadı");
    } finally {
      setOrderingSticker(false);
    }
  };

  const handlePaymentClose = () => {
    setPaytrToken(null);
    resetAddressForm();
    setOrderingStickerFor(null);
    fetchStickerOrders();
  };

  const resetAddressForm = () => {
    setAddrCity(""); setAddrDistrict(""); setAddrNeighborhood("");
    setAddrStreet(""); setAddrBuildingNo(""); setAddrFloor("");
    setAddrApartment(""); setAddrPostalCode(""); setStickerNote("");
    setStickerStep("package"); setStickerPackage(1);
  };

  const stickerPrice = stickerPackage === 1 ? 5000 : 7500;
  const stickerPriceLabel = stickerPackage === 1 ? "₺50.00" : "₺75.00";

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

  // ========== ORDER TRACKING VIEW ==========
  if (trackingVehicle) {
    const order = stickerOrders[trackingVehicle.id];
    const statusSteps = [
      { key: "pending", label: "Sipariş Alındı", icon: Package },
      { key: "preparing", label: "Hazırlanıyor", icon: QrCode },
      { key: "shipped", label: "Kargoya Verildi", icon: Truck },
      { key: "delivered", label: "Teslim Edildi", icon: CheckCircle2 },
    ];
    const currentIdx = statusSteps.findIndex(s => s.key === order?.status);

    return (
      <AppLayout>
        <div className="py-6">
          <div className="max-w-lg mx-auto px-4">
            <motion.div className="max-w-lg mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={() => setTrackingVehicle(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ChevronLeft className="w-4 h-4" /> Geri
              </button>

              <div className="glass rounded-2xl p-8 border border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-display font-bold text-foreground">Sipariş Takibi</h1>
                    <p className="text-sm text-muted-foreground">{trackingVehicle.plate} — {trackingVehicle.brand} {trackingVehicle.model}</p>
                  </div>
                </div>

                {/* Progress steps */}
                <div className="space-y-0 mb-8">
                  {statusSteps.map((step, i) => {
                    const isActive = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step.key} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                            isActive ? "border-primary bg-primary/10" : "border-border bg-secondary"
                          } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                            <step.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div className={`w-0.5 h-8 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />
                          )}
                        </div>
                        <div className="pt-2">
                          <p className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-primary mt-0.5">Mevcut durum</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order details */}
                {order && (
                  <div className="space-y-3 text-sm">
                    <div className="bg-secondary rounded-lg px-4 py-3 flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Teslimat Adresi</p>
                        <p className="text-foreground">{order.address}</p>
                      </div>
                    </div>
                    <div className="bg-secondary rounded-lg px-4 py-3 flex items-start gap-3">
                      <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sipariş Tarihi</p>
                        <p className="text-foreground">{new Date(order.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                    </div>
                    {order.note && (
                      <div className="bg-secondary rounded-lg px-4 py-3">
                        <p className="text-xs text-muted-foreground mb-1">Notunuz</p>
                        <p className="text-foreground">{order.note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
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
                {/* Vehicle info */}
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

                {/* QR Type Badge */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className={`rounded-lg px-3 py-2.5 border ${activatedStickers[v.id] ? "border-primary/30 bg-primary/5" : "border-border bg-secondary"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sticker className={`w-3.5 h-3.5 ${activatedStickers[v.id] ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-xs font-medium text-muted-foreground">Fiziksel QR</p>
                    </div>
                    <p className={`font-semibold text-sm ${activatedStickers[v.id] ? "text-primary" : "text-muted-foreground"}`}>
                      {activatedStickers[v.id] ? "Aktif ✓" : "Yok"}
                    </p>
                  </div>
                  <div className={`rounded-lg px-3 py-2.5 border ${hasQR ? "border-primary/30 bg-primary/5" : "border-border bg-secondary"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Monitor className={`w-3.5 h-3.5 ${hasQR ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-xs font-medium text-muted-foreground">Dijital QR</p>
                    </div>
                    <p className={`font-semibold text-sm ${hasQR ? "text-primary" : "text-muted-foreground"}`}>
                      {hasQR ? "Aktif ✓" : "Yok"}
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

                {/* QR Preview */}
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
                      Bu QR kodu sticker olarak aracınızın camına yapıştırın
                    </p>

                    {/* Sticker order / tracking button */}
                    {stickerOrders[v.id] ? (
                      <Button
                        onClick={() => setTrackingVehicle(v)}
                        variant="outline"
                        className="w-full border-primary/30 text-primary font-semibold py-5"
                      >
                        <Truck className="w-4 h-4 mr-2" /> Siparişi Takip Et
                      </Button>
                    ) : (
                      <Button
                        onClick={() => { setOrderingStickerFor(v); setStickerModalOpen(true); }}
                        className="w-full gradient-primary text-primary-foreground font-semibold py-5 glow-primary"
                      >
                        <Package className="w-4 h-4 mr-2" /> Sticker Sipariş Et
                      </Button>
                    )}
                  </div>
                )}

                {/* Actions */}
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
        {/* Sticker Order Modal */}
        <Dialog open={stickerModalOpen} onOpenChange={(open) => { setStickerModalOpen(open); if (!open) resetAddressForm(); }}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {stickerStep === "package" ? "Paket Seçin" : stickerStep === "address" ? "Teslimat Adresi" : "Sipariş Özeti"}
              </DialogTitle>
              <DialogDescription>
                {orderingStickerFor?.plate} plakalı aracınız için QR sticker gönderelim.
              </DialogDescription>
            </DialogHeader>

            {stickerStep === "package" ? (
              <div className="space-y-4">
                {/* Advantages */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" /> Fiziksel QR Sticker Avantajları
                  </h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Sun className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span>UV korumalı, <span className="text-foreground font-medium">güneş ve yağmura dayanıklı</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CloudRain className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Su geçirmez, <span className="text-foreground font-medium">dış mekan kalitesinde</span> baskı</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Dijital QR'dan <span className="text-foreground font-medium">daha hızlı taranır</span>, her zaman hazır</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <QrCode className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Profesyonel görünüm, <span className="text-foreground font-medium">7/24 aktif</span> bildirim</span>
                    </div>
                  </div>
                </div>

                {/* Package options */}
                <div className="space-y-3">
                  <button
                    onClick={() => setStickerPackage(1)}
                    className={`w-full rounded-xl p-4 border-2 text-left transition-all ${
                      stickerPackage === 1 ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">1 Adet Sticker</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Tek araç için ideal</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-display font-bold text-foreground">₺50</p>
                        <p className="text-[10px] text-muted-foreground">Kargo dahil</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setStickerPackage(2)}
                    className={`w-full rounded-xl p-4 border-2 text-left transition-all relative ${
                      stickerPackage === 2 ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      AVANTAJLI
                    </span>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">2 Adet Sticker</p>
                        <p className="text-xs text-muted-foreground mt-0.5">İki araç veya yedek için</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-display font-bold text-foreground">₺75</p>
                        <p className="text-[10px] text-muted-foreground line-through">₺100</p>
                      </div>
                    </div>
                  </button>
                </div>

                <Button onClick={() => setStickerStep("address")}
                  className="w-full gradient-primary text-primary-foreground font-semibold py-5">
                  Devam Et
                </Button>
              </div>
            ) : stickerStep === "address" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">İl *</Label>
                    <Input placeholder="Ankara" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">İlçe *</Label>
                    <Input placeholder="Çankaya" value={addrDistrict} onChange={(e) => setAddrDistrict(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mahalle *</Label>
                  <Input placeholder="Kızılay Mahallesi" value={addrNeighborhood} onChange={(e) => setAddrNeighborhood(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sokak / Cadde *</Label>
                  <Input placeholder="Atatürk Bulvarı" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bina No *</Label>
                    <Input placeholder="12" value={addrBuildingNo} onChange={(e) => setAddrBuildingNo(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kat</Label>
                    <Input placeholder="3" value={addrFloor} onChange={(e) => setAddrFloor(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Daire</Label>
                    <Input placeholder="5" value={addrApartment} onChange={(e) => setAddrApartment(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Posta Kodu</Label>
                  <Input placeholder="06420" value={addrPostalCode} onChange={(e) => setAddrPostalCode(e.target.value)} maxLength={5} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Not (opsiyonel)</Label>
                  <Input placeholder="Kapıda zil yok, lütfen arayın..." value={stickerNote} onChange={(e) => setStickerNote(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStickerStep("package")} className="flex-1">
                    Geri
                  </Button>
                  <Button onClick={() => setStickerStep("summary")} disabled={!isAddressValid()}
                    className="flex-1 gradient-primary text-primary-foreground font-semibold py-5">
                    Devam Et
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Vehicle info */}
                <div className="bg-secondary rounded-lg p-3 flex items-center gap-3">
                  <Car className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-display font-bold text-foreground tracking-wider text-sm">{orderingStickerFor?.plate}</p>
                    <p className="text-xs text-muted-foreground">{orderingStickerFor?.brand} {orderingStickerFor?.model}</p>
                  </div>
                </div>

                {/* Package info */}
                <div className="bg-secondary rounded-lg p-3 flex items-center gap-3">
                  <Package className="w-4 h-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Paket</p>
                    <p className="text-sm text-foreground font-medium">{stickerPackage} Adet Sticker</p>
                  </div>
                </div>

                {/* Address summary */}
                <div className="bg-secondary rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Teslimat Adresi</p>
                      <p className="text-sm text-foreground">{buildFullAddress()}</p>
                    </div>
                  </div>
                </div>

                {stickerNote && (
                  <div className="bg-secondary rounded-lg p-3 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Not</p>
                    <p className="text-foreground">{stickerNote}</p>
                  </div>
                )}

                {/* Price */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-display font-bold text-foreground">{stickerPriceLabel}</p>
                  <p className="text-xs text-muted-foreground">{stickerPackage} Adet Sticker + Kargo ücreti dahil</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStickerStep("address")} className="flex-1">
                    Geri
                  </Button>
                  <Button onClick={handleOrderSticker} disabled={orderingSticker}
                    className="flex-1 gradient-primary text-primary-foreground font-semibold">
                    {orderingSticker ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    Ödemeye Geç
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* PayTR Payment Modal */}
        <PayTRModal token={paytrToken} onClose={handlePaymentClose} />

        {/* Edit Modal */}
        <VehicleFormModal
          open={modalOpen} onOpenChange={setModalOpen}
          editing={editingVehicle} brand={formBrand} model={formModel} color={formColor}
          plate={formPlate} saving={saving}
          setBrand={setFormBrand} setModel={setFormModel} setColor={setFormColor}
          setPlate={setFormPlate}
          onSave={handleSave}
        />
      </AppLayout>
    );
  }

  // ========== VEHICLE LIST (Araçlarım) ==========
  return (
    <AppLayout>
      <div className="py-6">
        <div className="max-w-lg mx-auto px-4">
          <motion.div className="max-w-lg mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                {vehicles.length > 0 ? (
                  <>Araçlarım</>
                ) : (
                  <>Araç <span className="text-primary">Kaydet</span></>
                )}
              </h1>
              <p className="text-muted-foreground">
                {vehicles.length > 0
                  ? "Kayıtlı araçlarınızı yönetin ve QR kodlarınızı görüntüleyin"
                  : "QR kod oluşturmak için aracınızı kaydedin"}
              </p>
            </div>

            {vehicles.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center border border-border">
                <Car className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-6">Henüz kayıtlı aracınız yok</p>
                <Button onClick={openAddModal} className="gradient-primary text-primary-foreground font-semibold py-5 px-8 glow-primary">
                  <Plus className="w-4 h-4 mr-2" /> Araç Ekle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <motion.button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className="w-full glass rounded-xl p-4 border border-border hover:border-primary/30 transition-all text-left flex items-center gap-4 group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                      <QrCode className="w-4 h-4 text-primary/60 flex-shrink-0" />
                    )}
                  </motion.button>
                ))}

                {/* Add more button - no limit */}
                <button
                  onClick={openAddModal}
                  className="w-full rounded-xl p-4 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors border border-dashed border-primary/30"
                >
                  <Plus className="w-4 h-4" /> Yeni Araç Ekle
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      {/* Add/Edit Vehicle Modal */}
      <VehicleFormModal
        open={modalOpen} onOpenChange={setModalOpen}
        editing={editingVehicle} brand={formBrand} model={formModel} color={formColor}
        plate={formPlate} saving={saving}
        setBrand={setFormBrand} setModel={setFormModel} setColor={setFormColor}
        setPlate={setFormPlate}
        onSave={handleSave}
      />
    </AppLayout>
  );
};

// ========== VEHICLE FORM MODAL (no phone field) ==========
function VehicleFormModal({
  open, onOpenChange, editing, brand, model, color, plate, saving,
  setBrand, setModel, setColor, setPlate, onSave,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editing: Vehicle | null;
  brand: string; model: string; color: string; plate: string; saving: boolean;
  setBrand: (v: string) => void; setModel: (v: string) => void; setColor: (v: string) => void;
  setPlate: (v: string) => void; onSave: () => void;
}) {
  const models = brand ? (CAR_BRANDS[brand] || []) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            {editing ? "Aracı Düzenle" : "Yeni Araç Ekle"}
          </DialogTitle>
          <DialogDescription>
            {editing ? "Araç bilgilerini güncelleyin" : "Aracınızın bilgilerini girin ve QR kodunuzu oluşturun"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-primary" /> Plaka</Label>
            <Input placeholder="34 ABC 123" value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              className="tracking-widest font-display" maxLength={15} />
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label>Marka</Label>
            <Select value={brand} onValueChange={(v) => { setBrand(v); setModel(""); }}>
              <SelectTrigger><SelectValue placeholder="Marka seçin" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {Object.keys(CAR_BRANDS).map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel} disabled={!brand}>
              <SelectTrigger><SelectValue placeholder={brand ? "Model seçin" : "Önce marka seçin"} /></SelectTrigger>
              <SelectContent className="max-h-60">
                {models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Renk</Label>
            <div className="grid grid-cols-5 gap-2">
              {CAR_COLORS.map((c) => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    color === c.value ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                  }`}>
                  <span className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                  <span className="text-[10px] text-muted-foreground leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={onSave} disabled={saving}
            className="w-full gradient-primary text-primary-foreground font-semibold py-5 glow-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
            {editing ? "Güncelle" : "Kaydet & QR Oluştur"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GenerateQR;
