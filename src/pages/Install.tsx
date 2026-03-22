import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Car, Download, Share, Smartphone, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8">
              <Car className="w-10 h-10 text-primary-foreground" />
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              QR<span className="text-primary">Park</span> Uygulamasını Kur
            </h1>
            <p className="text-muted-foreground text-lg mb-10">
              Telefonunuza yükleyin, gerçek bir uygulama gibi kullanın — hızlı, çevrimdışı ve her zaman elinizin altında.
            </p>

            {isInstalled ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass rounded-2xl p-8 text-center"
              >
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                  Uygulama Zaten Yüklü!
                </h2>
                <p className="text-muted-foreground mb-6">
                  QRPark ana ekranınızdan açabilirsiniz.
                </p>
                <Link to="/">
                  <Button className="gradient-primary text-primary-foreground font-semibold py-6 px-8 glow-primary">
                    Ana Sayfaya Git <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            ) : deferredPrompt ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Button
                  onClick={handleInstall}
                  size="lg"
                  className="gradient-primary text-primary-foreground font-semibold py-7 px-10 text-lg glow-primary hover:opacity-90 transition-opacity"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Uygulamayı Yükle
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-8">
                {isIOS ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-8"
                  >
                    <Smartphone className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-display font-bold text-foreground mb-4">
                      iPhone / iPad'e Yükleme
                    </h2>
                    <div className="space-y-4 text-left max-w-sm mx-auto">
                      {[
                        "Safari'de bu sayfayı açın",
                        "Alt menüden Paylaş (Share) butonuna dokunun",
                        "\"Ana Ekrana Ekle\" seçeneğini seçin",
                        "\"Ekle\" butonuna dokunun",
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-muted-foreground text-sm pt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-8"
                  >
                    <Share className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-display font-bold text-foreground mb-4">
                      Android'e Yükleme
                    </h2>
                    <div className="space-y-4 text-left max-w-sm mx-auto">
                      {[
                        "Chrome tarayıcıda bu sayfayı açın",
                        "Sağ üstteki üç nokta menüsüne dokunun",
                        "\"Ana ekrana ekle\" veya \"Uygulamayı yükle\" seçin",
                        "\"Yükle\" butonuna dokunun",
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-muted-foreground text-sm pt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              {[
                { icon: Smartphone, title: "Gerçek Uygulama Hissi", desc: "Ana ekrandan açın, tam ekran deneyim" },
                { icon: Download, title: "Çevrimdışı Çalışır", desc: "İnternet olmadan da erişilebilir" },
                { icon: CheckCircle2, title: "Her Zaman Güncel", desc: "Otomatik güncellenir, mağaza gerekmez" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="glass rounded-xl p-5 text-center"
                >
                  <f.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Install;
