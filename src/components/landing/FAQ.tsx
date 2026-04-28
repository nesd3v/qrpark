import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "QRPark ücretsiz mi?", a: "Evet. Temel QR oluşturma ve bildirim alma ücretsizdir. Süresiz QR, sınırsız araç ve gelişmiş istatistikler Premium planda sunulur." },
  { q: "QR kodu nereden edinebilirim?", a: "'QR Oluştur' butonuna tıklayın, plakanızı girin ve QR kodunuzu anında oluşturun. Dilerseniz fiziksel etiketi kargo ile gönderiyoruz." },
  { q: "QR kodu okutan kişi bilgilerimi görebilir mi?", a: "Hayır. Yalnızca sorun türünü seçip bildirim iletebilir. Telefon numaranız ya da kişisel verileriniz hiçbir şekilde paylaşılmaz." },
  { q: "Bildirimler nasıl ulaşıyor?", a: "Kayıtlı telefon numaranıza SMS gönderilir. Tercihinize bağlı olarak acil durumlarda doğrudan çağrı da başlatılabilir." },
  { q: "QR kodum kaybolursa ne yapmalıyım?", a: "Aynı plaka ile yeni bir QR kodu oluşturabilirsiniz. Önceki kodunuz da çalışmaya devam eder." },
  { q: "Birden fazla araç ekleyebilir miyim?", a: "Evet. Bireysel Premium 5 araca kadar destek verir; Kurumsal Premium ise sınırsızdır." },
  { q: "Sahte bildirimleri nasıl önlüyorsunuz?", a: "Spam tespiti, hız limitleri ve manuel moderasyon ile kötüye kullanımın önüne geçiyoruz." },
];

const FAQ = () => {
  return (
    <section className="py-24 sm:py-32 relative border-t border-border/60">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-14 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-4 inline-block">
            S.S.S.
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-semibold mb-4 tracking-tight text-foreground">
            Sıkça sorulan <span className="font-serif italic font-normal text-primary">sorular</span>
          </h2>
          <p className="text-muted-foreground text-base">
            Aklınızdaki her soruya kısa ve net bir cevap.
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/60 bg-card/40">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="px-5 border-none"
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
