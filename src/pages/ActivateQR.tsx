import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, X, ChevronRight, Car, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";

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

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type Step = "instructions" | "scan" | "vehicle-info" | "done";

const ActivateQR = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("instructions");
  const [stickerCode, setStickerCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Vehicle form
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/activate");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (step === "scan") startScanner();
    return () => { stopScanner(); };
  }, [step]);

  const startScanner = async () => {
    setScanError(null);
    try {
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
      }
      const scanner = new Html5Qrcode("activate-qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          stopScanner();
          // Extract sticker code from URL or plain text
          let code = decodedText;
          try {
            const url = new URL(decodedText);
            const parts = url.pathname.split("/").filter(Boolean);
            // Expected: /notify/CODE or /activate/CODE
            code = parts[parts.length - 1] || decodedText;
          } catch {
            // Plain text code
          }
          
          // Verify the sticker code exists and is available
          const { data: stickerData, error } = await supabase
            .from("sticker_codes")
            .select("id, status")
            .eq("code", code)
            .maybeSingle();

          if (error || !stickerData) {
            toast.error("Bu QR kod tanınmadı. Lütfen geçerli bir QRPark sticker'ı tarayın.");
            setStep("scan");
            return;
          }

          if (stickerData.status === "activated") {
            toast.error("Bu sticker zaten aktive edilmiş.");
            setStep("instructions");
            return;
          }

          setStickerCode(code);
          setStep("vehicle-info");
          toast.success("QR kod başarıyla okundu!");
        },
        () => {}
      );
      setScanning(true);
    } catch (err: any) {
      setScanError(err?.message || "Kamera erişimi sağlanamadı.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleActivate = async () => {
    if (!plate.trim() || !brand || !model || !color) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      // Get user's phone from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", user.id)
        .single();
      const userPhone = profile?.phone || "";

      // Create vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .insert({
          plate: plate.trim().toUpperCase(),
          phone: userPhone,
          brand, model, color,
          user_id: user.id,
          verification_status: "verified",
        })
        .select("id")
        .single();

      if (vehicleError) {
        if (vehicleError.code === "23505") {
          toast.error("Bu plaka zaten kayıtlı");
          setSaving(false);
          return;
        }
        throw vehicleError;
      }

      // Auto-generate QR with 7-day expiry
      const now = new Date().toISOString();
      const qrExpiresAt = new Date(Date.now() + WEEK_MS).toISOString();
      await supabase.from("vehicles").update({
        last_qr_generated_at: now,
        qr_expires_at: qrExpiresAt,
      }).eq("id", vehicle.id);

      // Activate the sticker code
      await supabase
        .from("sticker_codes")
        .update({
          vehicle_id: vehicle.id,
          activated_by: user.id,
          activated_at: now,
          status: "activated",
        })
        .eq("code", stickerCode)
        .eq("status", "available");

      setStep("done");
      toast.success("Sticker başarıyla aktive edildi! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Aktivasyon başarısız");
    } finally {
      setSaving(false);
    }
  };

  const models = brand ? (CAR_BRANDS[brand] || []) : [];

  return (
    <AppLayout hideHeader>
      {/* Top bar */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">QR Aktivasyon</span>
          </div>
          <button
            onClick={() => { stopScanner(); navigate("/dashboard"); }}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => {
            const stepMap: Record<number, Step[]> = {
              1: ["instructions"],
              2: ["scan"],
              3: ["vehicle-info", "done"],
            };
            const isActive = stepMap[s].includes(step);
            const isPast = (s === 1 && step !== "instructions") || (s === 2 && (step === "vehicle-info" || step === "done"));
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isPast ? "bg-primary text-primary-foreground" :
                  isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 ${isPast ? "bg-primary" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Instructions */}
          {step === "instructions" && (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="space-y-0 mb-8">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">1</div>
                    <div className="w-0.5 h-16 bg-primary" />
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-lg font-display font-bold text-foreground">Sticker'ı Yapıştırın</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sipariş ettiğiniz Sticker'ı aracınızın ön camının sol alt köşesine, dışarıdan gözükecek şekilde iç taraftan yapıştırın.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">2</div>
                    <div className="w-0.5 h-16 bg-primary" />
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-lg font-display font-bold text-foreground">QR Kodu Okutun</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sonraki adımda açılacak QR Aktivasyon okucusundan sticker üzerindeki QR kodu okutun.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">3</div>
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-lg font-display font-bold text-foreground">Araç Bilgilerini Girin</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Araç bilgilerinizi girerek aktivasyonu tamamlayın. QR kodunuz hemen aktif olacak!
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <Button
                  onClick={() => setStep("scan")}
                  className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary"
                >
                  Devam Et <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Camera Scan */}
          {step === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <h2 className="text-xl font-display font-bold text-foreground text-center mb-2">QR Kodu Tarayın</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Sticker üzerindeki QR kodu kameranın önüne tutun
              </p>

              <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
                <div id="activate-qr-reader" className="w-full" style={{ minHeight: 300 }} />
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[250px] h-[250px] relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                      <motion.div
                        className="absolute left-2 right-2 h-0.5 bg-primary/60"
                        animate={{ top: ["10%", "90%", "10%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {scanError && (
                <motion.div
                  className="rounded-xl bg-destructive/10 border border-destructive/20 p-5 text-center mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-sm text-destructive font-medium mb-3">{scanError}</p>
                  <Button onClick={startScanner} variant="outline" size="sm">
                    Tekrar Dene
                  </Button>
                </motion.div>
              )}

              <Button
                variant="outline"
                onClick={() => { stopScanner(); setStep("instructions"); }}
                className="mt-4"
              >
                Geri
              </Button>
            </motion.div>
          )}

          {/* STEP 3: Vehicle Info */}
          {step === "vehicle-info" && (
            <motion.div
              key="vehicle-info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <h2 className="text-xl font-display font-bold text-foreground text-center mb-2">Araç Bilgileri</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Sticker'ı yapıştırdığınız aracın bilgilerini girin
              </p>

              <div className="space-y-4">
                {/* Plate */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-primary" /> Plaka</Label>
                  <Input
                    placeholder="34 ABC 123"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="tracking-widest font-display"
                    maxLength={15}
                  />
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
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger><SelectValue placeholder="Renk seçin" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {CAR_COLORS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <Button
                  onClick={handleActivate}
                  disabled={saving || !plate.trim() || !brand || !model || !color}
                  className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Aktive Et
                </Button>
              </div>
            </motion.div>
          )}

          {/* DONE */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Aktivasyon Tamamlandı!</h2>
              <p className="text-muted-foreground mb-8">
                Sticker'ınız aktif edildi. Artık araç sahibi olarak bildirim alabilirsiniz.
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="gradient-primary text-primary-foreground font-semibold py-5 px-8"
              >
                Ana Sayfaya Dön
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default ActivateQR;
