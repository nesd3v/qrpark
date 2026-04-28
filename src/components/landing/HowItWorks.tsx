import { motion } from "framer-motion";
import { QrCode, Scan, Send, Bell } from "lucide-react";

const steps = [
  { icon: QrCode, step: "01", title: "QR Kodu Oluştur", desc: "Plaka numaranı gir, sana özel QR'ı saniyeler içinde al." },
  { icon: Scan, step: "02", title: "Aracına Yapıştır", desc: "QR kodunu aracının camında görünür bir yere yerleştir." },
  { icon: Send, step: "03", title: "Birisi Okuttuğunda", desc: "Sorun türünü tek tıkla seçer, bildirim sana gönderilir." },
  { icon: Bell, step: "04", title: "Anında Haberin Olsun", desc: "SMS ile veya araman istenirse direkt çağrı al." },
];

const HowItWorks = () => {
  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="container mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4 inline-block">
            // workflow
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-4 tracking-tight">
            Dört adımda <span className="text-gradient-aurora">koruma altında</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Kurulum bir kahveden hızlı. Geri kalanını biz hallederiz.
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <div className="glass rounded-2xl p-6 h-full relative overflow-hidden hover:border-primary/40 transition-colors">
                <div className="absolute -top-6 -right-6 text-7xl font-display font-bold text-primary/[0.07] select-none">
                  {item.step}
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] text-accent uppercase tracking-wider">step {item.step}</span>
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
