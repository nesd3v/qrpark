import { motion } from "framer-motion";
import { ArrowRight, QrCode, Bell, Crown, Package, Truck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero pt-20">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/8 blur-[100px]" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-sm text-primary font-medium">Akıllı Park Bildirim Sistemi</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
            Aracınız İçin
            <br />
            <span className="text-primary glow-text">Anlık Bildirim</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            QR kodunu arabanıza yerleştirin. Herhangi bir sorun olduğunda
            anında bilgilendirilirsiniz — hatalı park, açık far, hasar ve daha fazlası.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? "/generate" : "/auth"}>
              <Button size="lg" className="gradient-primary text-primary-foreground font-semibold px-8 py-6 text-base glow-primary hover:opacity-90 transition-opacity">
                Hemen Başla
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="border-border text-foreground px-8 py-6 text-base hover:bg-secondary">
                Nasıl Çalışır?
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Action cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-20 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <Link to={user ? "/generate" : "/auth?redirect=/generate"}>
            <motion.div
              className="glass rounded-xl p-6 hover:border-primary/30 transition-colors group cursor-pointer h-full"
              whileHover={{ y: -4 }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 text-foreground">QR Aktivasyon</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Aracınızı kaydedin ve QR kodunuzu hemen aktifleştirin</p>
            </motion.div>
          </Link>

          <Link to={user ? "/generate" : "/auth?redirect=/generate"}>
            <motion.div
              className="glass rounded-xl p-6 hover:border-primary/30 transition-colors group cursor-pointer h-full"
              whileHover={{ y: -4 }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 text-foreground">Sticker Sipariş Et</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">QR kodlu sticker'ınızı kapınıza kadar gönderelim</p>
            </motion.div>
          </Link>

          <Link to={user ? "/generate" : "/auth?redirect=/generate"}>
            <motion.div
              className="glass rounded-xl p-6 hover:border-primary/30 transition-colors group cursor-pointer h-full"
              whileHover={{ y: -4 }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 text-foreground">Sipariş Takibi</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Sticker siparişinizin durumunu anlık olarak takip edin</p>
            </motion.div>
          </Link>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-8 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          id="features"
        >
          {[
            { icon: QrCode, title: "QR Oluştur", desc: "Plakanıza özel benzersiz QR kodu oluşturun" },
            { icon: Bell, title: "Anlık Bildirim", desc: "SMS ile anında haberdar olun" },
            { icon: Package, title: "Sticker Gönderimi", desc: "QR sticker'ınızı adresinize gönderelim" },
            { icon: Crown, title: "Premium Avantajlar", desc: "Sınırsız araç, özel tema, detaylı istatistikler" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="glass rounded-xl p-6 hover:border-primary/30 transition-colors group"
              whileHover={{ y: -4 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
