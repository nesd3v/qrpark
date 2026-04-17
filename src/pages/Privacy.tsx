import StaticPageShell from "@/components/layout/StaticPageShell";

const Privacy = () => (
  <StaticPageShell title="Gizlilik Politikası">
    <p>Son güncelleme: 17 Nisan 2026</p>

    <h2>1. Topladığımız Bilgiler</h2>
    <p>QRPark olarak yalnızca hizmetin sunulması için gerekli verileri topluyoruz: ad-soyad, telefon numarası, araç plakası, marka/model bilgileri ve QR kod kullanım istatistikleri.</p>

    <h2>2. Verilerin Kullanımı</h2>
    <ul>
      <li>QR kod ile araç sahibine bildirim gönderme</li>
      <li>Hesap güvenliği ve doğrulama (SMS OTP)</li>
      <li>Premium abonelik yönetimi</li>
      <li>Müşteri desteği</li>
    </ul>

    <h2>3. Verilerin Paylaşımı</h2>
    <p>Verileriniz hiçbir üçüncü tarafa satılmaz. Sadece SMS gönderimi (Twilio) ve ödeme işlemleri (PayTR) için zorunlu olan bilgiler ilgili servis sağlayıcılarla paylaşılır.</p>

    <h2>4. Veri Saklama</h2>
    <p>Hesabınızı sildiğinizde tüm kişisel verileriniz 30 gün içinde sistemlerimizden kalıcı olarak kaldırılır.</p>

    <h2>5. Çerezler</h2>
    <p>Uygulamamız oturum yönetimi için yalnızca zorunlu çerezleri kullanır. Üçüncü taraf takip çerezi kullanmıyoruz.</p>

    <h2>6. İletişim</h2>
    <p>Gizlilik ile ilgili sorularınız için: destek@qrpark.xyz</p>
  </StaticPageShell>
);

export default Privacy;
