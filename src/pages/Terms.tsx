import { motion } from "framer-motion";
import { ChevronLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <AppLayout title="Şartlar ve Koşullar">
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
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Şartlar ve Koşullar</h1>
          </div>
          <p className="text-xs text-muted-foreground">Son güncelleme: 13 Nisan 2026</p>

          <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">1. Hizmet Tanımı</h2>
              <p>
                QRPark, araç sahiplerine QR kod tabanlı bildirim hizmeti sunan bir platformdur.
                Kullanıcılar araçlarına QR kodlu sticker yapıştırarak, araçlarıyla ilgili acil
                durumlarda (hatalı park, açık far, cam açık vb.) SMS bildirimleri alabilirler.
              </p>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">2. Hesap Oluşturma</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Hizmeti kullanmak için telefon numaranızla kayıt olmanız gerekir</li>
                <li>Sağladığınız bilgilerin doğru ve güncel olması sizin sorumluluğunuzdadır</li>
                <li>Hesabınızın güvenliğinden siz sorumlusunuz</li>
                <li>18 yaşından küçükler hesap oluşturamaz</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">3. Araç Kaydı</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Yalnızca size ait veya kullanım hakkına sahip olduğunuz araçları kaydedebilirsiniz</li>
                <li>Araç plaka bilgisinin doğruluğundan siz sorumlusunuz</li>
                <li>Sahte veya başkasına ait araç kaydı tespit edildiğinde hesabınız askıya alınabilir</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">4. Bildirim Hizmeti</h2>
              <p>
                QRPark, QR kodu tarayan kişilerin gönderdiği bildirimleri araç sahibine SMS olarak
                iletir. Bildirimlerin doğruluğu ve içeriği gönderen kişinin sorumluluğundadır.
                QRPark, asılsız veya kötü niyetli bildirimlerden sorumlu tutulamaz.
              </p>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">5. Premium ve Kurumsal Abonelik</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Premium abonelikler aylık (₺49) veya yıllık (₺499) olarak satın alınabilir</li>
                <li>Ödeme işlemleri PayTR güvenli ödeme altyapısı üzerinden gerçekleştirilir</li>
                <li>Aboneliğinizi istediğiniz zaman Profil > Abonelik sayfasından iptal edebilirsiniz</li>
                <li>İptal sonrası dönem sonuna kadar premium özellikleri kullanmaya devam edersiniz</li>
                <li>Kurumsal plan için iletişim formundan başvuru yapılır, admin onayı sonrası aktifleşir</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">6. Yasak Kullanımlar</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Sistemi kötüye kullanmak veya spam bildirim göndermek</li>
                <li>Başkalarının hesaplarına yetkisiz erişim</li>
                <li>Yanıltıcı veya sahte bilgi sağlamak</li>
                <li>Hizmeti yasa dışı amaçlarla kullanmak</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">7. Sorumluluk Sınırı</h2>
              <p>
                QRPark, hizmet kesintileri, SMS gecikmesi, bildirim kaybı veya üçüncü taraf
                hizmet sağlayıcılardan kaynaklanan sorunlardan dolayı sorumlu tutulamaz.
                Hizmet "olduğu gibi" sunulur.
              </p>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">8. Değişiklikler</h2>
              <p>
                QRPark, bu şartları önceden bildirimde bulunarak değiştirme hakkını saklı tutar.
                Değişiklikler uygulama içinde duyurulur. Hizmeti kullanmaya devam etmeniz,
                güncel şartları kabul ettiğiniz anlamına gelir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">9. İletişim</h2>
              <p>
                Şartlar ve koşullarımız hakkında sorularınız için uygulama içi destek sohbetinden
                veya <span className="text-primary">destek@qrpark.xyz</span> adresinden bize ulaşabilirsiniz.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Terms;
