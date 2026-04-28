import { motion } from "framer-motion";
import { QrCode, Scan, Send, Bell } from "lucide-react";

const steps = [
  { icon: QrCode, step: "01", title: "QR Kodu Oluşturun", desc: "Plaka numaranızı girin, size özel QR kodunuzu alın." },
  { icon: Scan, step: "02", title: "Aracınıza Yerleştirin", desc: "QR kodu, aracınızın camında görünür bir noktaya yapıştırın." },
  { icon: Send, step: "03", title: "Birisi Okuttuğunda", desc: "Sorun türünü tek dokunuşla seçer ve bildirim iletir." },
  { icon: Bell, step: "04", title: "Anında Haberdar Olun", desc: "SMS ile bildirilirsiniz; tercih ederseniz arama da başlatılabilir." },
];

const HowItWorks = () => {
  return (
    <section id="how" className="relative py-24 sm:py-32 border-t border-border/60">
      <div className="container mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-4 inline-block">
            Süreç
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-semibold mb-4 tracking-tight text-foreground">
            Dört adımda <span className="font-serif italic font-normal text-primary">koruma altında</span>
          </h2>
          <p className="text-muted-foreground text-base">
            Kurulum birkaç dakika sürer. Geri kalanını biz hallederiz.
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/60 rounded-xl overflow-hidden border border-border/60 max-w-6xl mx-auto">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              className="relative bg-card/60 p-7 hover:bg-card/90 transition-colors"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-lg border border-border bg-background/40 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[11px] font-mono text-muted-foreground/70 tracking-wider">
                  {item.step}
                </span>
              </div>
              <h3 className="font-display font-semibold text-base mb-1.5 text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
