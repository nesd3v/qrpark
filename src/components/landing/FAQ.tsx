import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "QRPark ücretsiz mi?",
    a: "Evet! Temel QR kod oluşturma ve bildirim alma ücretsizdir. Sınırsız araç, süresiz QR ve gelişmiş geçmiş gibi özellikler Premium planda sunulur.",
  },
  {
    q: "QR kodu nereden edinebilirim?",
    a: "Sitemizden 'QR Oluştur' butonuna tıklayarak plaka numaranızı girip QR kodunuzu anında oluşturabilir ve indirebilirsiniz.",
  },
  {
    q: "QR kodu okutan kişi bilgilerimi görebilir mi?",
    a: "Hayır. QR kodu okutan kişi sadece sorun türünü seçip bildirim gönderebilir. Telefon numaranız veya kişisel bilgileriniz paylaşılmaz.",
  },
  {
    q: "Bildirimler nasıl geliyor?",
    a: "Araç için kayıtlı telefon numarasına SMS gönderilir veya araç sahibinin ayarına göre arama başlatılır.",
  },
  {
    q: "QR kodum kaybolursa ne yapmalıyım?",
    a: "Aynı plaka numarasıyla yeni bir QR kodu oluşturabilirsiniz. Eski QR kodunuz da çalışmaya devam edecektir.",
  },
  {
    q: "Birden fazla araç için QR kodu oluşturabilir miyim?",
    a: "Evet, her araç için farklı plaka numarasıyla ayrı QR kodları oluşturabilirsiniz.",
  },
  {
    q: "Sahte bildirim gönderilmesini nasıl engelliyorsunuz?",
    a: "Spam ve kötüye kullanım tespiti için çeşitli güvenlik önlemleri uygulamaktayız. Tekrarlayan sahte bildirimler otomatik olarak engellenir.",
  },
];

const FAQ = () => {
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
            Sıkça Sorulan <span className="text-primary">Sorular</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Merak ettiğiniz her şeyin cevabı burada
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
                className="glass rounded-xl px-6 border-none"
              >
                <AccordionTrigger className="text-foreground font-medium text-left hover:no-underline hover:text-primary transition-colors py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
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
