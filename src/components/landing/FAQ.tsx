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
    a: "Evet! Araç kaydı oluşturmak ve bildirim almak tamamen ücretsizdir. Sadece fiziksel sticker siparişi için ücret alınır.",
  },
  {
    q: "QR kodlu sticker'ı nasıl edinebilirim?",
    a: "Aracınızı kaydettikten sonra 'Sticker Sipariş Et' butonuna tıklayarak teslimat adresinizi girin. Sticker'ınız kapınıza kadar gönderilir.",
  },
  {
    q: "QR kodu okutan kişi bilgilerimi görebilir mi?",
    a: "Hayır. QR kodu okutan kişi sadece sorun türünü seçip bildirim gönderebilir. Telefon numaranız veya kişisel bilgileriniz paylaşılmaz.",
  },
  {
    q: "Bildirimler nasıl geliyor?",
    a: "Kayıt sırasında verdiğiniz telefon numarasına SMS olarak bildirim gönderilir.",
  },
  {
    q: "Sticker'ım kaybolursa ne yapmalıyım?",
    a: "Yeni bir sticker sipariş edebilirsiniz. Aynı QR kodunuz yeni sticker'ınızda da geçerli olacaktır.",
  },
  {
    q: "Birden fazla araç için sticker alabilir miyim?",
    a: "Evet, her araç için ayrı kayıt oluşturup her birine sticker sipariş edebilirsiniz.",
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
