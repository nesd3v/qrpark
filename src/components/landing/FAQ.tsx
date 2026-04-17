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
    a: "Evet! Temel özellikler tamamen ücretsizdir — araç kaydı, QR oluşturma ve bildirim alma. Süresiz QR ve sınırsız özellikler için Premium aboneliğe geçebilirsiniz.",
  },
  {
    q: "Premium plan ne sunuyor?",
    a: "Premium ile QR kodunuz hiç sona ermez, sınırsız bildirim alırsınız, öncelikli destek hattı ve gelişmiş istatistiklere erişiminiz olur. Aylık ₺49 veya yıllık ₺499 (~%15 indirim).",
  },
  {
    q: "Kurumsal plan nasıl çalışıyor?",
    a: "Filo sahipleri için özel kurumsal panel sunuyoruz. İletişim formundan başvurun, ekibimiz onayladıktan sonra çoklu araç yönetimi yapabileceğiniz kurumsal panele erişim kazanırsınız.",
  },
  {
    q: "QR kodu okutan kişi bilgilerimi görebilir mi?",
    a: "Hayır. QR kodu okutan kişi sadece sorun türünü seçip bildirim gönderebilir. Telefon numaranız veya kişisel bilgileriniz asla paylaşılmaz.",
  },
  {
    q: "Bildirimler nasıl geliyor?",
    a: "Kayıt sırasında verdiğiniz telefon numarasına SMS olarak anında bildirim gönderilir.",
  },
  {
    q: "Premium aboneliğimi nasıl iptal edebilirim?",
    a: "Profil > Abonelik sayfasından tek tıkla iptal edebilirsiniz. Ödediğiniz dönem sonuna kadar premium özellikleri kullanmaya devam edersiniz.",
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
