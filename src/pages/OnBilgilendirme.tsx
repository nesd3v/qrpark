import StaticPageShell from "@/components/layout/StaticPageShell";

const OnBilgilendirme = () => (
  <StaticPageShell title="Ön Bilgilendirme Formu">
    <p className="text-xs text-muted-foreground">Son güncelleme: 28.04.2026</p>

    <h2>1. Satıcı Bilgileri</h2>
    <ul>
      <li><strong>Ünvan:</strong> QRPark</li>
      <li><strong>İletişim:</strong> destek@qrpark.xyz</li>
      <li><strong>Web:</strong> https://www.qrpark.xyz</li>
    </ul>

    <h2>2. Hizmetin Temel Nitelikleri</h2>
    <p>
      QRPark Premium dijital aboneliği; aracınıza özel QR kod oluşturma, sınırsız QR
      yenileme, çoklu araç ekleme, gelişmiş bildirim geçmişi ve istatistik özelliklerini
      kapsayan dijital bir hizmettir. Fiziksel ürün teslimatı içermez.
    </p>

    <h2>3. Satış Bedeli (KDV Dahil)</h2>
    <ul>
      <li>Bireysel Aylık: ₺350</li>
      <li>Bireysel Yıllık: ₺3.490</li>
      <li>Kurumsal Aylık: ₺500</li>
      <li>Kurumsal Yıllık: ₺4.990</li>
    </ul>

    <h2>4. Ödeme Şekli</h2>
    <p>
      Ödemeler, PayTR güvenli ödeme altyapısı üzerinden tek çekim olarak kredi/banka kartı ile
      yapılır. Kart bilgileriniz QRPark sunucularında saklanmaz.
    </p>

    <h2>5. Teslimat</h2>
    <p>
      Hizmet, ödeme onayının ardından <strong>derhal</strong> hesabınızda aktif edilir.
      Fiziksel teslimat söz konusu değildir.
    </p>

    <h2>6. Cayma Hakkı</h2>
    <p>
      Mesafeli Sözleşmeler Yönetmeliği m.15/1-ğ uyarınca, elektronik ortamda anında ifa edilen
      hizmetler ve dijital içerikler için <strong>cayma hakkı bulunmamaktadır</strong>. Ödeme
      adımında bu istisnayı açıkça onaylamanız gerekir.
    </p>

    <h2>7. Otomatik Yenileme ve İptal</h2>
    <p>
      Üyeliğiniz seçtiğiniz periyot sonunda otomatik yenilenir. Hesabınızdaki <em>“Otomatik
      yenilemeyi kapat”</em> butonuyla yenilemeyi tek tıkla durdurabilirsiniz. Mevcut dönem
      sonuna kadar Premium aktif kalmaya devam eder.
    </p>

    <h2>8. Şikayet ve İletişim</h2>
    <p>
      Her türlü şikayet ve talepleriniz için: <strong>destek@qrpark.xyz</strong>
    </p>
  </StaticPageShell>
);

export default OnBilgilendirme;