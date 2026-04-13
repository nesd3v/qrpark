import { motion } from "framer-motion";
import { ChevronLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <AppLayout title="Gizlilik Politikası">
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
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Gizlilik Politikası</h1>
          </div>
          <p className="text-xs text-muted-foreground">Son güncelleme: 13 Nisan 2026</p>

          <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">1. Toplanan Veriler</h2>
              <p>QRPark, hizmet sunabilmek için aşağıdaki verileri toplar:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Telefon numarası (kimlik doğrulama ve bildirim amacıyla)</li>
                <li>Ad ve soyad</li>
                <li>Araç plakası, marka, model ve renk bilgileri</li>
                <li>Teslimat adresi (sticker siparişleri için)</li>
                <li>Cihaz bilgileri ve IP adresi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">2. Verilerin Kullanımı</h2>
              <p>Toplanan veriler aşağıdaki amaçlarla kullanılır:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>QR kod oluşturma ve araç bildirim hizmetinin sağlanması</li>
                <li>SMS ve push bildirimleri gönderimi</li>
                <li>Sticker siparişlerinin işlenmesi ve teslimatı</li>
                <li>Hizmet kalitesinin iyileştirilmesi</li>
                <li>Müşteri desteği sağlanması</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">3. Veri Paylaşımı</h2>
              <p>
                Kişisel verileriniz üçüncü taraflarla paylaşılmaz. Yalnızca SMS gönderimi için
                Twilio hizmet sağlayıcısı ile gerekli minimum veri paylaşılır. Yasal zorunluluk
                halinde yetkili makamlarla paylaşım yapılabilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">4. Veri Güvenliği</h2>
              <p>
                Verileriniz endüstri standardı şifreleme yöntemleri (AES-256) ile korunur.
                Veritabanı erişimleri satır düzeyinde güvenlik politikaları (RLS) ile kısıtlanmıştır.
                Düzenli güvenlik denetimleri gerçekleştirilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">5. Kullanıcı Hakları</h2>
              <p>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Verilerinizin düzeltilmesini veya silinmesini isteme</li>
                <li>Verilerinizin aktarılmasını talep etme</li>
                <li>İşlemeye itiraz etme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">6. Hesap Silme</h2>
              <p>
                Hesabınızı istediğiniz zaman Profil &gt; Hesabı Sil bölümünden silebilirsiniz.
                Hesap silme işlemi 30 gün içinde iptal edilebilir, sonrasında tüm verileriniz
                kalıcı olarak silinir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-display font-semibold text-foreground mb-2">7. İletişim</h2>
              <p>
                Gizlilik politikamız hakkında sorularınız için uygulama içi destek sohbetinden
                veya <span className="text-primary">destek@qrpark.xyz</span> adresinden bize ulaşabilirsiniz.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Privacy;
