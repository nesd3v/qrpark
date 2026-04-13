import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ScanLine, X, Flashlight, Home, Car, MessageSquare, User,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

const Scan = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code scanned — check if it's a QRPark URL
          stopScanner();
          if (decodedText.includes("/notify/")) {
            // Extract plate path and navigate
            const url = new URL(decodedText);
            navigate(url.pathname);
          } else {
            // Try as a direct plate path
            navigate(`/notify/${decodedText}`);
          }
        },
        () => {
          // Ignore scan failures (ongoing scanning)
        }
      );
      setScanning(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError(
        err?.message?.includes("NotAllowedError") || err?.message?.includes("Permission")
          ? "Kamera izni gerekli. Tarayıcı ayarlarından kamera iznini verin."
          : "Kamera başlatılamadı. Lütfen kameranızın çalıştığından emin olun."
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {}
    }
    setScanning(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">QR Tara</span>
          </div>
          <button
            onClick={() => { stopScanner(); navigate("/dashboard"); }}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
        <div className="max-w-lg w-full space-y-6">
          {/* Scanner viewport */}
          <motion.div
            className="relative rounded-2xl overflow-hidden border border-border bg-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div id="qr-reader" className="w-full" style={{ minHeight: 300 }} />

            {/* Scanner overlay frame */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[250px] h-[250px] relative">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                  {/* Scanning line animation */}
                  <motion.div
                    className="absolute left-2 right-2 h-0.5 bg-primary/60"
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {error ? (
            <motion.div
              className="rounded-xl bg-destructive/10 border border-destructive/20 p-5 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm text-destructive font-medium mb-3">{error}</p>
              <button
                onClick={startScanner}
                className="px-5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold"
              >
                Tekrar Dene
              </button>
            </motion.div>
          ) : (
            <motion.p
              className="text-center text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              QR kodu kameranın önüne tutun
            </motion.p>
          )}
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {[
            { id: "home", icon: Home, label: "Ana Sayfa", path: "/dashboard" },
            { id: "vehicles", icon: Car, label: "Araçlarım", path: "/generate" },
            { id: "scan", icon: ScanLine, label: "Tara", path: "/scan" },
            { id: "messages", icon: MessageSquare, label: "Mesajlar", path: "/messages" },
            { id: "profile", icon: User, label: "Profil", path: "/profile" },
          ].map((tab) => {
            const isCenter = tab.id === "scan";
            const isActive = tab.id === "scan";

            if (isCenter) {
              return (
                <button key={tab.id} className="flex flex-col items-center -mt-5">
                  <div className="w-14 h-14 rounded-full gradient-primary glow-primary flex items-center justify-center shadow-lg">
                    <ScanLine className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] text-primary font-medium mt-1">{tab.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex flex-col items-center py-1 px-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="h-safe-area-bottom" />
      </nav>
    </div>
  );
};

export default Scan;
