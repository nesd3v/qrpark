import { motion } from "framer-motion";
import { ArrowRight, Crown, Clock, Car, Palette, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const premiumPerks = [
  { icon: Clock, text: "Süresiz QR kod" },
  { icon: Car, text: "Sınırsız araç" },
  { icon: BarChart3, text: "Detaylı istatistikler" },
  { icon: Palette, text: "Özel QR tema" },
];

const CTA = () => {
  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center glass rounded-2xl p-12 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 blur-[80px] rounded-full" />

          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4 relative">
            Aracınızı Hemen
            <br />
            <span className="text-primary">Koruma Altına Alın</span>
          </h2>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto relative">
            Ücretsiz QR kodunuz <span className="text-primary font-semibold">7 gün</span> geçerlidir. 
            Premium'a geçerek süresiz QR ve tüm özelliklerin kilidini açın.
          </p>

          {/* Premium perks */}
          <div className="flex flex-wrap justify-center gap-3 mb-8 relative">
            {premiumPerks.map((perk) => (
              <div key={perk.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <perk.icon className="w-3.5 h-3.5" />
                {perk.text}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
            <Link to="/generate">
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground font-semibold px-10 py-6 text-base glow-primary hover:opacity-90 transition-opacity"
              >
                Ücretsiz Başla (7 Gün)
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button
                variant="outline"
                size="lg"
                className="border-primary/30 text-primary px-8 py-6 text-base hover:bg-primary/5"
              >
                <Crown className="w-4 h-4 mr-2" />
                Premium Planlar
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
