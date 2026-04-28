import { motion } from "framer-motion";
import { ArrowRight, Crown, Clock, Car, Palette, BarChart3 } from "lucide-react";
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
    <section className="py-24 sm:py-32 border-t border-border/60">
      <div className="container mx-auto px-6">
        <motion.div
          className="max-w-4xl mx-auto relative rounded-2xl overflow-hidden border border-border/70 bg-card/60 p-10 sm:p-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Subtle accent wash */}
          <div className="absolute inset-0 opacity-50 pointer-events-none">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/12 blur-[120px]" />
          </div>

          <div className="relative text-center">
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-4 inline-block">
              Premium
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-semibold text-foreground mb-4 tracking-tight leading-[1.1]">
              Aracınızı bugün <span className="font-serif italic font-normal text-primary">koruma</span> altına alın.
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-base">
              Ücretsiz QR'ınız 7 gün geçerlidir. Premium ile tüm özelliklere erişin.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-9">
              {premiumPerks.map((perk) => (
                <div key={perk.text} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/70 bg-background/40 text-xs text-foreground/80">
                  <perk.icon className="w-3.5 h-3.5 text-primary" />
                  {perk.text}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/generate">
                <Button size="lg" className="h-11 px-7 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                  Ücretsiz Başla
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="h-11 px-7 bg-transparent border-border text-foreground hover:bg-secondary/50">
                  <Crown className="w-4 h-4 mr-1 text-primary" />
                  Planları İnceleyin
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
