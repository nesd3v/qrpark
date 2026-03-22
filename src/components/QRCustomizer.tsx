import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Sparkles, Circle, Square, Image, Upload, X } from "lucide-react";
import carIcon from "@/assets/qr-icons/car-icon.png";
import steeringIcon from "@/assets/qr-icons/steering-icon.png";
import shieldIcon from "@/assets/qr-icons/shield-icon.png";
import parkingIcon from "@/assets/qr-icons/parking-icon.png";

export type QRStyle = {
  id: string;
  label: string;
  fg: string;
  bg: string;
  cornerRadius: number;
  dotStyle: "squares" | "dots" | "rounded";
  logoUrl: string | null;
};

const COLOR_PALETTES = [
  { id: "classic", label: "Klasik", fg: "#0a0f1a", bg: "#e8ecf0" },
  { id: "ocean", label: "Okyanus", fg: "#0c4a6e", bg: "#e0f2fe" },
  { id: "forest", label: "Orman", fg: "#14532d", bg: "#dcfce7" },
  { id: "sunset", label: "Gün Batımı", fg: "#7c2d12", bg: "#fff7ed" },
  { id: "royal", label: "Kraliyet", fg: "#4c1d95", bg: "#f5f3ff" },
  { id: "cherry", label: "Kiraz", fg: "#881337", bg: "#fff1f2" },
  { id: "midnight", label: "Gece", fg: "#1e1b4b", bg: "#eef2ff" },
  { id: "coffee", label: "Kahve", fg: "#451a03", bg: "#fef3c7" },
  { id: "slate", label: "Çelik", fg: "#1e293b", bg: "#f1f5f9" },
  { id: "rose", label: "Gül", fg: "#9f1239", bg: "#fce7f3" },
  { id: "emerald", label: "Zümrüt", fg: "#065f46", bg: "#d1fae5" },
  { id: "amber", label: "Kehribar", fg: "#78350f", bg: "#fef3c7" },
];

const DOT_STYLES: { id: QRStyle["dotStyle"]; label: string; icon: typeof Square }[] = [
  { id: "squares", label: "Kare", icon: Square },
  { id: "rounded", label: "Yumuşak", icon: Circle },
  { id: "dots", label: "Nokta", icon: Circle },
];

const PRESET_LOGOS = [
  { id: "car", label: "Araç", src: carIcon },
  { id: "steering", label: "Direksiyon", src: steeringIcon },
  { id: "shield", label: "Kalkan", src: shieldIcon },
  { id: "parking", label: "Park", src: parkingIcon },
];

type Props = {
  isPremium: boolean;
  selectedStyle: QRStyle;
  onStyleChange: (style: QRStyle) => void;
};

const QRCustomizer = ({ isPremium, selectedStyle, onStyleChange }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isPremium) return null;

  const updateColor = (palette: (typeof COLOR_PALETTES)[0]) => {
    onStyleChange({ ...selectedStyle, id: palette.id, label: palette.label, fg: palette.fg, bg: palette.bg });
  };

  const updateDotStyle = (dotStyle: QRStyle["dotStyle"]) => {
    onStyleChange({ ...selectedStyle, dotStyle });
  };

  const setLogo = (url: string | null) => {
    onStyleChange({ ...selectedStyle, logoUrl: url });
  };

  const handleCustomLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full group"
      >
        <Palette className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">QR Stil Özelleştirme</span>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">PREMIUM</span>
        <Sparkles className="w-3.5 h-3.5 text-primary/50 ml-auto group-hover:text-primary transition-colors" />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-4"
          >
            {/* Color Palette */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Renk Paleti</p>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => updateColor(palette)}
                    className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                      selectedStyle.id === palette.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 bg-secondary/50"
                    }`}
                  >
                    <div className="flex gap-0.5">
                      <span className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: palette.fg }} />
                      <span className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: palette.bg }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-none">{palette.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dot Style */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">QR Şekli</p>
              <div className="flex gap-2">
                {DOT_STYLES.map((style) => {
                  const Icon = style.icon;
                  return (
                    <button
                      key={style.id}
                      onClick={() => updateDotStyle(style.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-xs font-medium ${
                        selectedStyle.dotStyle === style.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logo / Icon */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5" /> Merkez Logo
              </p>
              <div className="flex gap-2 flex-wrap">
                {/* No logo option */}
                <button
                  onClick={() => setLogo(null)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all w-14 ${
                    !selectedStyle.logoUrl
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary/50 hover:border-primary/30"
                  }`}
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">Yok</span>
                </button>

                {/* Preset logos */}
                {PRESET_LOGOS.map((logo) => (
                  <button
                    key={logo.id}
                    onClick={() => setLogo(logo.src)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all w-14 ${
                      selectedStyle.logoUrl === logo.src
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary/50 hover:border-primary/30"
                    }`}
                  >
                    <img src={logo.src} alt={logo.label} className="w-5 h-5 object-contain" />
                    <span className="text-[9px] text-muted-foreground">{logo.label}</span>
                  </button>
                ))}

                {/* Custom upload */}
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleCustomLogo} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all w-14 ${
                    selectedStyle.logoUrl && !PRESET_LOGOS.some((l) => l.src === selectedStyle.logoUrl)
                      ? "border-primary bg-primary/5"
                      : "border-dashed border-border bg-secondary/50 hover:border-primary/30"
                  }`}
                >
                  {selectedStyle.logoUrl && !PRESET_LOGOS.some((l) => l.src === selectedStyle.logoUrl) ? (
                    <img src={selectedStyle.logoUrl} alt="Özel" className="w-5 h-5 object-contain rounded" />
                  ) : (
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-[9px] text-muted-foreground">Özel</span>
                </button>
              </div>
            </div>

            {/* Live Mini Preview */}
            <div className="flex items-center justify-center pt-1">
              <div
                className="w-12 h-12 rounded-lg grid grid-cols-3 grid-rows-3 gap-[2px] p-1.5 relative"
                style={{ backgroundColor: selectedStyle.bg }}
              >
                {[1, 0, 1, 0, 0, 0, 1, 0, 1].map((filled, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: filled ? selectedStyle.fg : "transparent",
                      borderRadius:
                        selectedStyle.dotStyle === "dots" ? "50%" : selectedStyle.dotStyle === "rounded" ? "2px" : "0px",
                    }}
                  />
                ))}
                {selectedStyle.logoUrl && (
                  <img
                    src={selectedStyle.logoUrl}
                    alt=""
                    className="absolute inset-0 m-auto w-4 h-4 object-contain"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DEFAULT_QR_STYLE: QRStyle = {
  id: "classic",
  label: "Klasik",
  fg: "#0a0f1a",
  bg: "#e8ecf0",
  cornerRadius: 0,
  dotStyle: "squares",
  logoUrl: null,
};

export default QRCustomizer;
