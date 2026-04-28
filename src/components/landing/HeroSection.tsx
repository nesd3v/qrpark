import { motion } from "framer-motion";
import { ArrowRight, QrCode, Bell, Shield, Clock, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Aurora orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-primary/25 blur-[140px] animate-orb-drift" />
        <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-tertiary/20 blur-[140px] animate-orb-drift" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-accent/15 blur-[160px] animate-orb-drift" style={{ animationDelay: "-3s" }} />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 grid-bg" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground/80">
              Akıllı Park Bildirim Sistemi
            </span>
            <span className="text-[10px] font-mono text-primary/80 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
              v2.0
            </span>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.95] mb-7 tracking-tight">
            <span className="text-foreground">Aracın için</span>
            <br />
            <span className="text-shimmer">anlık iletişim.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            QR kodu camına yapıştır. Hatalı park, açık far ya da bir hasar olursa
            anında haberin olsun. <span className="text-foreground/90">Telefon numaran asla görünmez.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
            <Link to="/generate" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-7 gradient-primary text-primary-foreground font-semibold glow-primary hover:opacity-95 hover:scale-[1.02] transition-all"
              >
                Ücretsiz QR Oluştur
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <a href="#how" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-7 bg-transparent border-border/60 text-foreground hover:bg-secondary/40 hover:border-primary/40"
              >
                <Sparkles className="w-4 h-4 mr-1 text-accent" />
                Nasıl Çalışır?
              </Button>
            </a>
          </div>

          {/* Trust strip */}
          <motion.div
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" /> KVKK uyumlu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" /> Saniyeler içinde kurulum
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-tertiary" /> 7 gün ücretsiz
            </span>
          </motion.div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mt-20 sm:mt-24 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          id="features"
        >
          {[
            { icon: QrCode, title: "QR Oluştur", desc: "Plakana özel benzersiz kod", color: "primary" },
            { icon: Bell, title: "Anlık SMS", desc: "Saniyeler içinde haberin olur", color: "accent" },
            { icon: Shield, title: "Gizli Numara", desc: "Telefonun asla paylaşılmaz", color: "tertiary" },
            { icon: Clock, title: "Süresiz Premium", desc: "Tek seferlik fiyat, sonsuz QR", color: "primary" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="group relative glass rounded-2xl p-4 sm:p-5 overflow-hidden hover:-translate-y-1 transition-transform duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.08 }}
            >
              <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-${item.color}/10 blur-2xl group-hover:bg-${item.color}/20 transition-colors`} />
              <div className={`relative w-10 h-10 rounded-xl bg-${item.color}/10 border border-${item.color}/20 flex items-center justify-center mb-3`}>
                <item.icon className={`w-5 h-5 text-${item.color}`} />
              </div>
              <h3 className="font-display font-semibold text-sm sm:text-base mb-1 text-foreground">{item.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
