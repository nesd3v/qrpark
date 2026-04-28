import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "QRPark ücretsiz mi?", a: "Evet. Temel QR oluşturma ve bildirim alma ücretsizdir. Süresiz QR, sınırsız araç ve gelişmiş istatistikler Premium planda gelir." },
  { q: "QR kodu nereden edinebilirim?", a: "'QR Oluştur' butonuna tıkla, plakanı gir ve QR kodunu anında oluştur. Fiziksel etiket sipariş etmek istersen kargo ile gönderiyoruz." },
  { q: "QR kodu okutan kişi bilgilerimi görebilir mi?", a: "Hayır. Sadece sorun türünü seçip bildirim gönderebilir. Telefon numaran ya da kişisel verilerin asla paylaşılmaz." },
  { q: "Bildirimler nasıl geliyor?", a: "Kayıtlı telefon numarana SMS gönderilir. Tercihen acil durumlarda doğrudan çağrı da başlatılabilir." },
  { q: "QR kodum kaybolursa?", a: "Aynı plaka ile yeni bir QR oluşturabilirsin. Eski kodun da çalışmaya devam eder." },
  { q: "Birden fazla araç ekleyebilir miyim?", a: "Evet. Her araç için ayrı QR oluşturursun. Bireysel Premium 5 araca kadar, Kurumsal Premium sınırsızdır." },
  { q: "Sahte bildirimleri nasıl engelliyorsunuz?", a: "Spam tespiti, hız limitleri ve manuel moderasyon ile kötüye kullanım otomatik engellenir." },
];

const FAQ = () => {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-14 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-4 inline-block">// faq</span>
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-4 tracking-tight">
            Sık sorulan <span className="text-gradient-aurora">sorular</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Aklındaki her soruya net bir cevap.
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="glass rounded-2xl px-6 border-none data-[state=open]:border-primary/30 data-[state=open]:ring-1 data-[state=open]:ring-primary/20 transition-all"
              >
                <AccordionTrigger className="text-foreground font-medium text-left hover:no-underline hover:text-primary transition-colors py-5 text-[15px]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5 text-sm">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
