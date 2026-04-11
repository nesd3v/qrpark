import { motion } from "framer-motion";
import { Car, Users, QrCode, Bell } from "lucide-react";

const stats = [
  { icon: Users, value: "12,500+", label: "Kayıtlı Kullanıcı" },
  { icon: QrCode, value: "38,000+", label: "QR Kodu Oluşturuldu" },
  { icon: Bell, value: "95,000+", label: "Bildirim Gönderildi" },
  { icon: Car, value: "50+", label: "Şehirde Aktif" },
];

const Stats = () => {
  return (
    <section className="py-20 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
