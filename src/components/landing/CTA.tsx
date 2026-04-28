import { motion } from "framer-motion";
import { ArrowRight, Crown, Clock, Car, Palette, BarChart3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const premiumPerks = [
  { icon: Clock, text: "Süresiz QR" },
  { icon: Car, text: "Sınırsız araç" },
  { icon: BarChart3, text: "Detaylı istatistik" },
  { icon: Palette, text: "Özel QR tema" },
];

const CTA = () => {
  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-6">
        <motion.div
          className="max-w-4xl mx-auto relative rounded-[2rem] overflow-hidden glass-strong p-10 sm:p-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Aurora wash */}
          <div className="absolute inset-0 opacity-60">
            <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-primary/30 blur-[100px] animate-orb-drift" />
            <div className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-tertiary/25 blur-[100px] animate-orb-drift" style={{ animationDelay: "-5s" }} />
            <div className="absolute top-1/3 right-0 w-48 h-48 rounded-full bg-accent/20 blur-[90px] animate-orb-drift" style={{ animationDelay: "-9s" }} />
          </div>

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-mono uppercase tracking-wider text-accent">premium experience</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4 tracking-tight leading-[1.05]">
              Aracını <span className="text-gradient-aurora">şimdi</span>
              <br />koruma altına al.
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-base md:text-lg">
              Ücretsiz QR'ın <span className="text-primary font-semibold">7 gün</span> geçerli.
              Premium ile tüm kilitleri kaldır.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {premiumPerks.map((perk) => (
                <div key={perk.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-medium text-foreground/85">
                  <perk.icon className="w-3.5 h-3.5 text-primary" />
                  {perk.text}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/generate">
                <Button size="lg" className="h-12 px-8 gradient-primary text-primary-foreground font-semibold glow-primary hover:scale-[1.02] transition-transform">
                  Ücretsiz Başla
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="h-12 px-8 bg-transparent border-border/60 text-foreground hover:border-accent/40 hover:bg-accent/5">
                  <Crown className="w-4 h-4 mr-1 text-accent" />
                  Premium Planlar
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
