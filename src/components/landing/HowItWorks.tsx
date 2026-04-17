import { motion } from "framer-motion";
import { QrCode, Scan, Send, Bell } from "lucide-react";

const steps = [
  {
    icon: QrCode,
    step: "01",
    title: "QR Kodu Oluşturun",
    desc: "Plaka numaranızı girin ve size özel QR kodunuzu indirin.",
  },
  {
    icon: Scan,
    step: "02",
    title: "Aracınıza Yerleştirin",
    desc: "QR kodunu arabanızın camına yapıştırın.",
  },
  {
    icon: Send,
    step: "03",
    title: "Birisi Okuttuğunda",
    desc: "Sorun türünü seçip bildirim gönderir.",
  },
  {
    icon: Bell,
    step: "04",
    title: "Anında Haberdar Olun",
    desc: "WhatsApp veya SMS ile bilgilendirme alın.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-foreground">
            Nasıl <span className="text-primary">Çalışır?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Dört basit adımda aracınızı koruma altına alın
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="glass rounded-xl p-6 h-full relative overflow-hidden">
                <span className="absolute top-4 right-4 text-5xl font-display font-bold text-primary/10">
                  {item.step}
                </span>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
