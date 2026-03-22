import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTA = () => {
  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-6">
        <motion.div
          className="max-w-2xl mx-auto text-center glass rounded-2xl p-12 relative overflow-hidden"
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
          <p className="text-muted-foreground mb-8 max-w-md mx-auto relative">
            Ücretsiz QR kodunuzu oluşturun ve herhangi bir sorun olduğunda
            anında haberdar olun.
          </p>
          <Link to="/generate" className="relative">
            <Button
              size="lg"
              className="gradient-primary text-primary-foreground font-semibold px-10 py-6 text-base glow-primary hover:opacity-90 transition-opacity"
            >
              Ücretsiz QR Oluştur
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
