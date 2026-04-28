import { motion } from "framer-motion";
import { ArrowRight, QrCode, Bell, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-20">
      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full bg-primary/10 blur-[140px]" />
      </div>

      {/* Refined grid */}
      <div className="absolute inset-0 grid-bg" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/70 bg-card/40 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="text-xs font-medium text-muted-foreground tracking-wide">
              Akıllı Park Bildirim Sistemi
            </span>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-semibold leading-[1.02] mb-6 tracking-tight text-foreground">
            Aracınız için
            <br />
            <span className="font-serif italic font-normal text-primary">güvenli</span>{" "}
            <span className="text-foreground">iletişim.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            QR kodu camınıza yapıştırın. Hatalı park, açık far veya bir hasar
            olduğunda anında haberdar olun. Telefon numaranız asla görünmez.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-14">
            <Link to="/generate" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-11 px-6 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Ücretsiz QR Oluştur
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <a href="#how" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-11 px-6 bg-transparent border-border text-foreground hover:bg-secondary/50"
              >
                Nasıl Çalışır?
              </Button>
            </a>
          </div>

          {/* Trust strip */}
          <motion.div
            className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" /> KVKK uyumlu
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" /> 7 gün ücretsiz deneme
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-primary" /> Anlık SMS bildirimi
            </span>
          </motion.div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-20 sm:mt-24 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          id="features"
        >
          {[
            { icon: QrCode, title: "Özel QR", desc: "Plakanıza özel benzersiz kod" },
            { icon: Bell, title: "Anlık SMS", desc: "Saniyeler içinde haberdar olun" },
            { icon: Shield, title: "Gizli Numara", desc: "Telefonunuz hiç paylaşılmaz" },
            { icon: Clock, title: "Süresiz Premium", desc: "Tek seferlik fiyat, sonsuz QR" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="group relative rounded-xl p-5 border border-border/70 bg-card/40 hover:bg-card/70 hover:border-border transition-colors"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.06 }}
            >
              <div className="w-9 h-9 rounded-lg border border-border bg-background/40 flex items-center justify-center mb-4">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1 text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
