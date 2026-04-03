import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Download, Car, RefreshCw, CheckCircle2, AlertTriangle, Crown, Palette,
  Plus, ChevronDown, Lock, Upload, FileImage, XCircle, ShieldCheck, Loader2, Phone,
} from "lucide-react";
import QRCustomizer, { DEFAULT_QR_STYLE, type QRStyle } from "@/components/QRCustomizer";
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

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// QR themes moved to QRCustomizer component

type Vehicle = {
  id: string;
  plate: string;
  phone: string;
  last_qr_generated_at: string | null;
  verification_status: string;
};

type AddVehicleStep = "info" | "ruhsat" | "processing" | "result";

const GenerateQR = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<QRStyle>(DEFAULT_QR_STYLE);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Add vehicle state
  const [addStep, setAddStep] = useState<AddVehicleStep>("info");
  const [newPlate, setNewPlate] = useState("");
  const [newPhone, setNewPhone] = useState("+90 ");
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [ruhsatFile, setRuhsatFile] = useState<File | null>(null);
  const [ruhsatPreview, setRuhsatPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processingLabel, setProcessingLabel] = useState("");
  const [verificationResult, setVerificationResult] = useState<{ status: string; message: string } | null>(null);

  // Show add vehicle flow: when no vehicles exist, or user clicks "add"
  const [showAddFlow, setShowAddFlow] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/generate");
      return;
    }
    if (user) {
      fetchVehicles();
    }
  }, [user, authLoading]);

  const fetchVehicles = async () => {
    setLoadingVehicle(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, plate, phone, last_qr_generated_at, verification_status")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });

    if (error) console.error("Vehicle fetch error:", error);

    const allVehicles = (data as Vehicle[]) || [];
    setVehicles(allVehicles);

    if (allVehicles.length > 0) {
      const first = allVehicles[0];
      setSelectedVehicle(first);
      if (first.last_qr_generated_at) setGenerated(true);
    }

    setLoadingVehicle(false);
  };

  const handleSelectVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
    setShowVehicleSelector(false);
    setGenerated(!!v.last_qr_generated_at);
  };

  // --- Phone formatter ---
  const formatPhone = (val: string) => {
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
    return formatted;
  };

  // --- File handling ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Sadece JPG, PNG veya WebP formatı desteklenir");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Dosya boyutu en fazla 5MB olabilir");
      return;
    }
    setRuhsatFile(file);
    const reader = new FileReader();
    reader.onload = () => setRuhsatPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setRuhsatFile(null);
    setRuhsatPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetAddFlow = () => {
    setShowAddFlow(false);
    setAddStep("info");
    setNewPlate("");
    setNewPhone("+90 ");
    setRuhsatFile(null);
    setRuhsatPreview(null);
    setVerificationResult(null);
    setProcessingLabel("");
  };

  // --- Get user's full_name for ruhsat verification ---
  const getUserFullName = async (): Promise<string> => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user!.id)
      .maybeSingle();
    return data?.full_name || "";
  };

  // --- Add vehicle with ruhsat verification ---
  const handleAddVehicleSubmit = async () => {
    if (!ruhsatFile) {
      toast.error("Lütfen ruhsat fotoğrafını yükleyin");
      return;
    }

    setAddStep("processing");
    setProcessingLabel("Araç kaydediliyor...");
    setAddingVehicle(true);

    try {
      // 1. Insert vehicle
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .insert({
          plate: newPlate.trim().toUpperCase(),
          phone: newPhone.trim(),
          user_id: user!.id,
        })
        .select("id, plate, phone, last_qr_generated_at, verification_status")
        .single();

      if (vehicleError) {
        if (vehicleError.code === "23505") {
          toast.error("Bu plaka zaten kayıtlı");
          setAddStep("info");
          return;
        }
        throw vehicleError;
      }

      const vehicle = vehicleData as Vehicle;

      // 2. Upload ruhsat photo
      setProcessingLabel("Ruhsat yükleniyor...");
      const fileExt = ruhsatFile.name.split(".").pop() || "jpg";
      const filePath = `${user!.id}/${vehicle.id}/ruhsat.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("ruhsat-photos")
        .upload(filePath, ruhsatFile, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setVerificationResult({
          status: "pending",
          message: "Ruhsat yüklenemedi ama aracınız kaydedildi. Daha sonra tekrar deneyebilirsiniz.",
        });
        setVehicles((prev) => [...prev, vehicle]);
        setSelectedVehicle(vehicle);
        setAddStep("result");
        return;
      }

      // 3. AI verification
      setProcessingLabel("AI ile ruhsat doğrulanıyor...");
      const fullName = await getUserFullName();

      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        "verify-ruhsat",
        {
          body: {
            vehicle_id: vehicle.id,
            photo_path: filePath,
            plate: newPlate.trim().toUpperCase(),
            full_name: fullName,
          },
        }
      );

      if (verifyError) {
        console.error("Verify error:", verifyError);
        setVerificationResult({
          status: "pending",
          message: "Ruhsat fotoğrafınız admin tarafından incelenecek",
        });
      } else {
        setVerificationResult({
          status: verifyData?.status || "pending",
          message: verifyData?.message || "Doğrulama tamamlandı",
        });
        vehicle.verification_status = verifyData?.status || "pending";
      }

      setVehicles((prev) => [...prev, vehicle]);
      setSelectedVehicle(vehicle);
      setGenerated(false);
      setAddStep("result");
    } catch (err: any) {
      toast.error(err.message || "Bir hata oluştu");
      setAddStep("ruhsat");
    } finally {
      setAddingVehicle(false);
    }
  };

  const canRegenerate = () => {
    if (isPremium) return true;
    if (!selectedVehicle?.last_qr_generated_at) return true;
    const lastGen = new Date(selectedVehicle.last_qr_generated_at).getTime();
    return Date.now() - lastGen >= WEEK_MS;
  };

  const daysUntilRegenerate = () => {
    if (isPremium) return 0;
    if (!selectedVehicle?.last_qr_generated_at) return 0;
    const lastGen = new Date(selectedVehicle.last_qr_generated_at).getTime();
    const remaining = WEEK_MS - (Date.now() - lastGen);
    return Math.ceil(remaining / (24 * 60 * 60 * 1000));
  };

  const handleGenerate = async () => {
    if (!selectedVehicle) return;

    // Check verification status
    if (selectedVehicle.verification_status === "rejected") {
      toast.error("Aracınızın ruhsat doğrulaması reddedildi. Lütfen tekrar deneyin.");
      return;
    }
    if (selectedVehicle.verification_status === "pending") {
      toast.error("Aracınızın ruhsat doğrulaması henüz tamamlanmadı. Lütfen bekleyin.");
      return;
    }

    if (!canRegenerate()) {
      toast.error(`QR kodunuzu ${daysUntilRegenerate()} gün sonra yenileyebilirsiniz`);
      return;
    }

    setRegenerating(true);
    try {
      const now = new Date().toISOString();
      // Free users: QR expires in 7 days. Premium: no expiry.
      const qrExpiresAt = isPremium ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from("vehicles")
        .update({ last_qr_generated_at: now, qr_expires_at: qrExpiresAt })
        .eq("id", selectedVehicle.id);

      if (error) throw error;

      const updated = { ...selectedVehicle, last_qr_generated_at: now };
      setSelectedVehicle(updated);
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setGenerated(true);
      toast.success("QR kodunuz oluşturuldu!");
    } catch (err) {
      console.error(err);
      toast.error("Bir hata oluştu");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || !selectedVehicle) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    canvas.width = 400;
    canvas.height = 400;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 400, 400);
      const link = document.createElement("a");
      link.download = `qrpark-${selectedVehicle.plate}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("QR kodu indirildi!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };

  const notifyUrl = selectedVehicle
    ? `${window.location.origin}/notify/${encodeURIComponent(selectedVehicle.plate)}`
    : "";

  if (authLoading || loadingVehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ========== ADD VEHICLE FLOW ==========
  const shouldShowAddFlow = showAddFlow || vehicles.length === 0;

  if (shouldShowAddFlow) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-6">
            <motion.div className="max-w-lg mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

              {/* Result */}
              {addStep === "result" && verificationResult && (
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    verificationResult.status === "verified" ? "bg-primary/10" :
                    verificationResult.status === "pending" ? "bg-yellow-500/10" : "bg-destructive/10"
                  }`}>
                    {verificationResult.status === "verified" ? <ShieldCheck className="w-10 h-10 text-primary" /> :
                     verificationResult.status === "pending" ? <AlertTriangle className="w-10 h-10 text-yellow-500" /> :
                     <XCircle className="w-10 h-10 text-destructive" />}
                  </div>
                  <h1 className="text-2xl font-display font-bold text-foreground mb-3">
                    {verificationResult.status === "verified" ? "Araç Doğrulandı!" :
                     verificationResult.status === "pending" ? "İnceleme Bekleniyor" : "Doğrulama Başarısız"}
                  </h1>
                  <p className="text-muted-foreground mb-6">{verificationResult.message}</p>
                  <Button onClick={resetAddFlow}
                    className="gradient-primary text-primary-foreground font-semibold py-6 px-8 glow-primary hover:opacity-90 transition-opacity">
                    {verificationResult.status === "verified" ? "QR Kod Oluştur" : "Tamam"}
                  </Button>
                </div>
              )}

              {/* Processing */}
              {addStep === "processing" && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                  <h2 className="text-xl font-display font-bold text-foreground mb-2">{processingLabel}</h2>
                  <p className="text-muted-foreground text-sm">Lütfen bekleyin...</p>
                </div>
              )}

              {/* Step 1: Plate + Phone */}
              {addStep === "info" && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                      Araç <span className="text-primary">Kaydet</span>
                    </h1>
                    <p className="text-muted-foreground">
                      QR kod oluşturmak için önce aracınızı kaydedin
                    </p>
                  </div>

                  <div className="glass rounded-2xl p-8 space-y-5">
                    <div className="space-y-2">
                      <Label className="text-foreground font-medium flex items-center gap-2">
                        <Car className="w-4 h-4 text-primary" /> Plaka Numarası
                      </Label>
                      <Input
                        placeholder="34 ABC 123"
                        value={newPlate}
                        onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground tracking-widest font-display"
                        maxLength={15}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" /> Telefon Numarası
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">🇹🇷</span>
                        <Input
                          placeholder="5XX XXX XX XX"
                          value={newPhone}
                          onChange={(e) => setNewPhone(formatPhone(e.target.value))}
                          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pl-10 tracking-wide"
                          maxLength={17}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Bildirimler bu numaraya gönderilecek</p>
                    </div>

                    <Button
                      onClick={() => {
                        if (!newPlate.trim()) {
                          toast.error("Lütfen plaka numarasını girin");
                          return;
                        }
                        const phoneDigits = newPhone.replace(/\D/g, "");
                        if (phoneDigits.length < 12) {
                          toast.error("Lütfen geçerli bir telefon numarası girin");
                          return;
                        }
                        setAddStep("ruhsat");
                      }}
                      className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity"
                    >
                      Devam Et
                    </Button>

                    {vehicles.length > 0 && (
                      <button type="button" onClick={resetAddFlow}
                        className="block mx-auto text-sm text-muted-foreground hover:text-foreground">
                        İptal
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Ruhsat Upload */}
              {addStep === "ruhsat" && (
                <>
                  <div className="text-center mb-8">
                    <FileImage className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h1 className="text-2xl font-display font-bold text-foreground mb-2">Ruhsat Doğrulama</h1>
                    <p className="text-muted-foreground text-sm">
                      Aracın size ait olduğunu doğrulamak için ruhsat fotoğrafını yükleyin
                    </p>
                  </div>

                  <div className="glass rounded-2xl p-8 space-y-5">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground">
                        AI, ruhsattaki <span className="font-bold">{newPlate}</span> plakasını doğrulayacak
                      </span>
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect} className="hidden" />

                    <AnimatePresence mode="wait">
                      {ruhsatPreview ? (
                        <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="relative rounded-xl overflow-hidden border border-border bg-secondary">
                          <img src={ruhsatPreview} alt="Ruhsat önizleme" className="w-full h-44 object-cover" />
                          <div className="absolute top-2 right-2">
                            <Button type="button" variant="outline" size="sm" onClick={removeFile}
                              className="bg-background/80 backdrop-blur-sm border-border text-foreground hover:bg-destructive/10 hover:text-destructive">
                              <XCircle className="w-4 h-4 mr-1" /> Kaldır
                            </Button>
                          </div>
                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Fotoğraf yüklendi
                          </div>
                        </motion.div>
                      ) : (
                        <motion.button key="upload" type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }} onClick={() => fileInputRef.current?.click()}
                          className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-secondary/50 hover:bg-primary/5 transition-all p-8 flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Ruhsat fotoğrafı yükle</span>
                          <span className="text-xs text-muted-foreground">JPG, PNG veya WebP • Maks 5MB</span>
                        </motion.button>
                      )}
                    </AnimatePresence>

                    <Button onClick={handleAddVehicleSubmit} disabled={!ruhsatFile || addingVehicle}
                      className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40">
                      <ShieldCheck className="w-5 h-5 mr-2" /> Kaydet ve Doğrula
                    </Button>

                    <button type="button" onClick={() => setAddStep("info")}
                      className="block mx-auto text-sm text-muted-foreground hover:text-foreground">
                      ← Bilgilere geri dön
                    </button>
                  </div>
                </>
              )}

            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ========== MAIN QR VIEW ==========
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <motion.div className="max-w-lg mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                QR Kodu <span className="text-primary">Oluştur</span>
              </h1>
              <p className="text-muted-foreground">
                Aracınıza özel QR kodu aşağıda yer almaktadır
              </p>
            </div>

            {/* Vehicle selector for multiple vehicles */}
            {vehicles.length > 1 && (
              <div className="mb-4 flex items-center justify-center gap-2">
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
              </div>
            )}

            {/* Add vehicle button */}
            {isPremium ? (
              <div className="mb-6">
                <button
                  onClick={() => setShowAddFlow(true)}
                  className="w-full glass rounded-xl p-4 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors border border-dashed border-primary/30"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Araç Ekle
                </button>
              </div>
            ) : vehicles.length >= 1 && (
              <div className="mb-6 glass rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Birden fazla araç eklemek için</p>
                  <p className="text-xs text-muted-foreground">Premium abonelikle sınırsız araç kaydedebilirsiniz</p>
                </div>
                <Link to="/pricing">
                  <span className="text-xs font-bold text-primary hover:underline">Geç →</span>
                </Link>
              </div>
            )}

            {/* Verification status warning */}
            {selectedVehicle && selectedVehicle.verification_status !== "verified" && (
              <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <p className="text-xs text-yellow-600">
                  {selectedVehicle.verification_status === "pending"
                    ? "Aracınızın ruhsat doğrulaması henüz tamamlanmadı. QR kod oluşturmak için doğrulama gereklidir."
                    : "Aracınızın ruhsat doğrulaması reddedildi. Lütfen yeni bir araç kaydedin."}
                </p>
              </div>
            )}

            <div className="glass rounded-2xl p-8">
              {generated && selectedVehicle ? (
                <motion.div
                  className="flex flex-col items-center gap-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>

                  <h2 className="text-xl font-display font-bold text-foreground">QR Kodunuz Oluşturuldu!</h2>

                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-secondary">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="font-display font-bold text-foreground tracking-widest">{selectedVehicle.plate}</span>
                  </div>

                  {/* QR Customizer for Premium */}
                  <QRCustomizer
                    isPremium={isPremium}
                    selectedStyle={selectedStyle}
                    onStyleChange={setSelectedStyle}
                  />

                  {/* Non-premium upsell */}
                  {!isPremium && (
                    <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-muted border border-border">
                      <Palette className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Özel QR renkleri ve şekiller için{" "}
                        <Link to="/pricing" className="text-primary font-medium hover:underline">
                          Premium'a geçin
                        </Link>
                      </p>
                    </div>
                  )}

                  <div ref={qrRef} className="p-6 rounded-xl" style={{ backgroundColor: selectedStyle.fg }}>
                    <QRCodeSVG
                      value={notifyUrl}
                      size={220}
                      bgColor={selectedStyle.bg}
                      fgColor={selectedStyle.fg}
                      level="H"
                      {...(selectedStyle.logoUrl ? {
                        imageSettings: {
                          src: selectedStyle.logoUrl,
                          height: 40,
                          width: 40,
                          excavate: true,
                        }
                      } : {})}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Bu QR kodu aracınızın camına yapıştırın
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button onClick={handleDownload} variant="outline"
                      className="flex-1 border-primary/30 text-primary hover:bg-primary/10">
                      <Download className="w-4 h-4 mr-2" /> PNG Olarak İndir
                    </Button>
                    <Button onClick={() => {
                      if (!canRegenerate()) {
                        toast.error(`QR kodunuzu ${daysUntilRegenerate()} gün sonra yenileyebilirsiniz`);
                        return;
                      }
                      setGenerated(false);
                    }} variant="outline"
                      className="flex-1 border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
                      <RefreshCw className="w-4 h-4 mr-2" /> Yeni QR Oluştur
                    </Button>
                  </div>

                  {!isPremium && !canRegenerate() && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 w-full">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <p className="text-xs text-yellow-600">
                        QR kodunuzu haftada 1 kez yenileyebilirsiniz. Sonraki yenileme {daysUntilRegenerate()} gün sonra.{" "}
                        <Link to="/pricing" className="font-medium underline">Premium ile sınırsız yenileyin</Link>
                      </p>
                    </div>
                  )}

                  {!isPremium && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/5 border border-destructive/20 w-full">
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                      <p className="text-xs text-destructive">
                        Ücretsiz planda QR kodunuz oluşturulduktan <span className="font-bold">7 gün sonra</span> devre dışı kalır.{" "}
                        <Link to="/pricing" className="font-medium underline">Premium ile süresiz kullanın</Link>
                      </p>
                    </div>
                  )}

                  {isPremium && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 w-full">
                      <Crown className="w-4 h-4 text-primary flex-shrink-0" />
                      <p className="text-xs text-primary">Premium: Sınırsız QR yenileme ve süresiz QR kod hakkınız var</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-secondary">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="font-display font-bold text-foreground tracking-widest">{selectedVehicle?.plate}</span>
                  </div>

                  <p className="text-muted-foreground text-center text-sm">
                    Aracınız için yeni bir QR kod oluşturmak için aşağıdaki butona tıklayın.
                  </p>

                  {!isPremium && !canRegenerate() && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 w-full">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <p className="text-xs text-yellow-600">
                        QR kodunuzu haftada 1 kez yenileyebilirsiniz. Sonraki yenileme {daysUntilRegenerate()} gün sonra.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={regenerating || !canRegenerate() || selectedVehicle?.verification_status !== "verified"}
                    className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {regenerating ? "Oluşturuluyor..." : "QR Kodu Oluştur"}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GenerateQR;
