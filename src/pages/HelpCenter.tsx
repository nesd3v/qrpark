import { motion } from "framer-motion";
import {
  ChevronLeft, HelpCircle, QrCode, Bell, Truck, Phone,
  Shield, MessageCircle, ChevronRight, Smartphone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

const faqs = [
  {
    category: "Başlangıç",
    icon: QrCode,
    items: [
      {
        q: "QRPark nasıl çalışır?",
        a: "Aracınıza QR kodlu bir sticker yapıştırırsınız. Birisi aracınızla ilgili bir sorun fark ettiğinde QR kodu telefonuyla tarar ve size bildirim gönderir.",
      },
      {
        q: "Nasıl kayıt olurum?",
        a: "Telefon numaranızı girin, SMS ile gelen 6 haneli kodu doğrulayın ve araç bilgilerinizi ekleyin. İşlem 2 dakikadan kısa sürer.",
      },
      {
        q: "QR sticker nasıl alırım?",
        a: "Aracınızı kaydettikten sonra Profil > Sticker Sipariş Takibi veya Araçlarım sayfasından sipariş verebilirsiniz. Sticker adresinize kargo ile gönderilir.",
      },
    ],
  },
  {
    category: "Bildirimler",
    icon: Bell,
    items: [
      {
        q: "Bildirimler nasıl geliyor?",
        a: "Birisi QR kodunuzu taradığında otomatik olarak SMS bildirimi alırsınız. Ayrıca push bildirimleri de açabilirsiniz.",
      },
      {
        q: "Hangi sorunlar bildirilebilir?",
        a: "Hatalı park, çift sıra park, açık far, cam açık, kapı açık, bagaj açık, alarm çalıyor, hasar, patlak lastik ve daha fazlası.",
      },
      {
        q: "SMS ücreti var mı?",
        a: "Bildirim SMS'leri QRPark tarafından karşılanır, size ek ücret yansımaz.",
      },
    ],
  },
  {
    category: "Sipariş ve Teslimat",
    icon: Truck,
    items: [
      {
        q: "Sticker ne kadar sürede gelir?",
        a: "Siparişiniz 3-7 iş günü içinde belirttiğiniz adrese kargo ile teslim edilir.",
      },
      {
        q: "Siparişimi nasıl takip ederim?",
        a: "Profil sayfanızdaki 'Sticker Sipariş Takibi' bölümünden siparişinizin durumunu anlık olarak görebilirsiniz.",
      },
    ],
  },
  {
    category: "Hesap",
    icon: Shield,
    items: [
      {
        q: "Telefon numaramı değiştirebilir miyim?",
        a: "Evet, Profil > Profili Düzenle bölümünden telefon numaranızı güncelleyebilirsiniz.",
      },
      {
        q: "Hesabımı nasıl silerim?",
        a: "Profil sayfasının altındaki 'Hesabı Sil' butonunu kullanabilirsiniz. Silme işlemi 30 gün içinde iptal edilebilir.",
      },
      {
        q: "Birden fazla araç ekleyebilir miyim?",
        a: "Evet, istediğiniz kadar araç ekleyebilirsiniz. Her araç için ayrı QR sticker sipariş edebilirsiniz.",
      },
    ],
  },
];

const HelpCenter = () => {
  const navigate = useNavigate();
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <AppLayout title="Yardım Merkezi">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Geri
        </button>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Yardım Merkezi</h1>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => window.dispatchEvent(new Event("open-support-chat"))}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
            >
              <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Bize Ulaşın</p>
                <p className="text-[11px] text-muted-foreground">Destek sohbeti</p>
              </div>
            </button>
            <a
              href="tel:+908501234567"
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
            >
              <Phone className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Telefon</p>
                <p className="text-[11px] text-muted-foreground">0850 123 45 67</p>
              </div>
            </a>
          </div>

          {/* FAQ sections */}
          <div className="space-y-4">
            {faqs.map((section) => (
              <div key={section.category} className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{section.category}</span>
                </div>
                <div className="divide-y divide-border">
                  {section.items.map((item) => {
                    const key = `${section.category}-${item.q}`;
                    const isOpen = openItem === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setOpenItem(isOpen ? null : key)}
                        className="w-full text-left px-4 py-3.5 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground pr-4">{item.q}</span>
                          <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          </motion.div>
                        </div>
                        {isOpen && (
                          <motion.p
                            className="text-sm text-muted-foreground mt-2 leading-relaxed"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                          >
                            {item.a}
                          </motion.p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div className="rounded-2xl bg-card border border-border p-5 text-center">
            <Smartphone className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">Hâlâ yardıma mı ihtiyacınız var?</p>
            <p className="text-xs text-muted-foreground mb-3">
              Uygulama içi destek sohbetinden veya <span className="text-primary">destek@qrpark.xyz</span> adresinden bize ulaşın.
            </p>
            <button
              onClick={() => window.dispatchEvent(new Event("open-support-chat"))}
              className="px-5 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold"
            >
              Destek Sohbeti Başlat
            </button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default HelpCenter;
