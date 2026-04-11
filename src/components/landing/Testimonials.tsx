import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Mehmet Y.",
    city: "İstanbul",
    text: "Farlarımı açık bırakmıştım, QRPark sayesinde birisi beni hemen bilgilendirdi. Akü sorunu yaşamadım!",
    rating: 5,
  },
  {
    name: "Ayşe K.",
    city: "Ankara",
    text: "Aracıma çarpıp kaçan bir kişi oldu ama bir vatandaş QR kodumu okutup bana haber verdi. Harika sistem!",
    rating: 5,
  },
  {
    name: "Emre D.",
    city: "İzmir",
    text: "Camı açık bıraktığımı fark etmemiştim. Yağmur başlamadan biri beni uyardı. Teşekkürler QRPark!",
    rating: 5,
  },
  {
    name: "Zeynep A.",
    city: "Bursa",
    text: "Park yerine düzgün park etmediğimi bildirdiler, hemen gidip düzelttim. Çok pratik bir çözüm.",
    rating: 4,
  },
  {
    name: "Ali R.",
    city: "Antalya",
    text: "Tüm aile araçlarına QRPark QR kodu yapıştırdık. Artık hepimiz daha güvende hissediyoruz.",
    rating: 5,
  },
  {
    name: "Selin T.",
    city: "Eskişehir",
    text: "Kurulumu çok kolay, QR kodu oluşturup camıma yapıştırdım. İlk bildirim 3 gün içinde geldi!",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-foreground">
            Kullanıcı <span className="text-primary">Yorumları</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Binlerce araç sahibi QRPark'a güveniyor
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.name}
              className="glass rounded-xl p-6 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    className={`w-4 h-4 ${
                      si < item.rating ? "text-warning fill-warning" : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <p className="text-foreground text-sm leading-relaxed flex-1 mb-4">
                "{item.text}"
              </p>
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
