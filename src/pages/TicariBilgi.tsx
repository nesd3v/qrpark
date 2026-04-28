import StaticPageShell from "@/components/layout/StaticPageShell";

const TicariBilgi = () => (
  <StaticPageShell title="Ticari Bilgilendirme">
    <p className="text-xs text-muted-foreground">Son güncelleme: 28.04.2026</p>

    <p>
      6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili mevzuat
      kapsamında, hizmet sağlayıcı olarak aşağıdaki bilgileri kullanıcılarımızın
      erişimine açık tutmaktayız.
    </p>

    <h2>1. İşletme Bilgileri</h2>
    <ul>
      <li><strong>Ticari ünvan:</strong> QRPark</li>
      <li><strong>MERSİS No:</strong> [Şirket kuruluşu sonrası eklenecektir]</li>
      <li><strong>Vergi Dairesi / VKN:</strong> [Şirket kuruluşu sonrası eklenecektir]</li>
      <li><strong>ETBİS Kayıt No:</strong> [Kayıt sonrası eklenecektir]</li>
      <li><strong>Faaliyet alanı:</strong> Yazılım geliştirme, dijital abonelik hizmetleri</li>
    </ul>

    <h2>2. İletişim Bilgileri</h2>
    <ul>
      <li><strong>E-posta:</strong> destek@qrpark.xyz</li>
      <li><strong>Web:</strong> https://www.qrpark.xyz</li>
      <li><strong>Adres:</strong> [Şirket merkez adresi eklenecektir]</li>
    </ul>

    <h2>3. Sunulan Hizmet</h2>
    <p>
      QRPark, araç sahiplerine plakalarına özel QR kod oluşturma ve telefon numaralarını
      açıklamadan SMS / e-posta yoluyla iletişim kurulmasını sağlayan dijital bir
      platformdur. Ücretli Premium üyelik ile gelişmiş özellikler sunulur.
    </p>

    <h2>4. Fiyatlandırma (KDV Dahil)</h2>
    <ul>
      <li>Bireysel Premium Aylık: ₺350 / Yıllık: ₺3.490</li>
      <li>Kurumsal Premium Aylık: ₺500 / Yıllık: ₺4.990</li>
    </ul>

    <h2>5. Ödeme ve Faturalandırma</h2>
    <p>
      Ödemeler PayTR Sanal POS altyapısı üzerinden alınır. Her başarılı ödemenin ardından
      e-Arşiv Fatura, Alıcı’nın checkout sırasında belirttiği bilgiler doğrultusunda
      düzenlenip e-posta ile gönderilir.
    </p>

    <h2>6. İade Süreci</h2>
    <p>
      Dijital hizmet niteliği nedeniyle cayma hakkı bulunmamaktadır. İade koşulları için
      <a href="/cayma"> Cayma Hakkı ve İade</a> sayfasını inceleyiniz.
    </p>

    <h2>7. Şikayet ve Çözüm Mercileri</h2>
    <ul>
      <li>İlk başvuru: destek@qrpark.xyz</li>
      <li>Tüketici Hakem Heyetleri (parasal sınırlar dahilinde)</li>
      <li>Tüketici Mahkemeleri</li>
    </ul>
  </StaticPageShell>
);

export default TicariBilgi;