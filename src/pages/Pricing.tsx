import { motion } from "framer-motion";
import { Check, QrCode, Car, Bell, Clock, Package, Phone, Shield } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Car, title: "Sınırsız Araç Kaydı", desc: "İstediğiniz kadar aracı sisteme ekleyin" },
  { icon: QrCode, title: "QR Kod Oluşturma", desc: "Her aracınız için benzersiz QR kod" },
  { icon: Bell, title: "Anlık Bildirim", desc: "Aracınızla ilgili sorunlardan anında haberdar olun" },
  { icon: Clock, title: "7 Günlük QR Süresi", desc: "QR kodunuz 7 gün geçerlidir, sonra yenileyin" },
  { icon: Package, title: "Sticker Gönderimi", desc: "QR kodlu sticker'ınızı adresinize gönderelim" },
  { icon: Phone, title: "SMS Bildirimi", desc: "Bildirimler SMS ile telefonunuza ulaşır" },
  { icon: Shield, title: "Destek", desc: "Canlı destek ile her an yanınızdayız" },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Tamamen <span className="text-primary">Ücretsiz</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              QRPark'ın tüm özellikleri ücretsiz olarak kullanımınıza açıktır
            </p>
          </motion.div>

          {/* Free plan card */}
          <motion.div
            className="max-w-md mx-auto glass rounded-2xl p-8 border-2 border-primary relative mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
              TAMAMEN ÜCRETSİZ
            </div>
            <div className="text-center mb-6">
              <span className="text-5xl font-bold text-foreground">₺0</span>
              <span className="text-muted-foreground">/sonsuza kadar</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f.title} className="flex items-center gap-3 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {f.title}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(user ? "/generate" : "/auth")}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
            >
              {user ? "Araçlarıma Git" : "Hemen Başla"}
            </button>
          </motion.div>

          {/* Features grid */}
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">
              Tüm <span className="text-primary">Özellikler</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="glass rounded-xl p-5 border border-border"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pricing;
