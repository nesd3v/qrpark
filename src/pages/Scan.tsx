import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScanLine, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import MobileLayout from "@/components/layout/MobileLayout";

const Scan = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []);

  const startScanner = async () => {
    setError(null);
    try {
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
      }
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopScanner();
          let target = decodedText;
          try {
            const url = new URL(decodedText);
            if (url.pathname.includes("/notify/")) target = url.pathname;
            else target = `/notify/${decodedText}`;
          } catch {
            target = `/notify/${decodedText}`;
          }
          navigate(target);
        },
        () => {}
      );
      setScanning(true);
    } catch (err: any) {
      setError(err?.message || "Kamera erişimi sağlanamadı. Lütfen kamera izinlerini kontrol edin.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  return (
    <MobileLayout hideHeader>
      {/* Custom top bar */}
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

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full space-y-6">
          <motion.div
            className="relative rounded-2xl overflow-hidden border border-border bg-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div id="qr-reader" className="w-full" style={{ minHeight: 300 }} />
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
      </div>
    </MobileLayout>
  );
};

export default Scan;
