import StaticPageShell from "@/components/layout/StaticPageShell";

const MesafeliSatis = () => (
  <StaticPageShell title="Mesafeli Satış Sözleşmesi">
    <p className="text-xs text-muted-foreground">Son güncelleme: 28.04.2026</p>

    <h2>1. Taraflar</h2>
    <p>
      İşbu Mesafeli Satış Sözleşmesi (“Sözleşme”), aşağıda bilgileri yer alan
      <strong> SATICI</strong> ile, www.qrpark.xyz internet sitesi (“Site”) üzerinden
      hizmet satın alan <strong>ALICI</strong> arasında elektronik ortamda kurulmuştur.
    </p>
    <ul>
      <li><strong>Satıcı:</strong> QRPark</li>
      <li><strong>İletişim:</strong> destek@qrpark.xyz</li>
      <li><strong>Web sitesi:</strong> https://www.qrpark.xyz</li>
    </ul>
    <p>
      Alıcı; ödeme adımında belirttiği ad-soyad/ünvan, T.C. Kimlik No / Vergi Kimlik No,
      adres, e-posta ve telefon bilgileriyle taraf olur.
    </p>

    <h2>2. Sözleşme Konusu</h2>
    <p>
      Sözleşme’nin konusu, Alıcı’nın Site üzerinden elektronik ortamda satın aldığı,
      aşağıda nitelikleri ve satış fiyatı belirtilen <strong>QRPark Premium dijital abonelik</strong>
      hizmetinin satışı ve ifasına ilişkin tarafların hak ve yükümlülüklerinin belirlenmesidir.
    </p>

    <h2>3. Hizmetin Niteliği ve Bedeli</h2>
    <ul>
      <li><strong>Hizmet:</strong> QRPark Premium üyelik (dijital içerik/hizmet)</li>
      <li><strong>Süre:</strong> Aylık veya yıllık (Alıcı tarafından seçilen plan)</li>
      <li>
        <strong>Bedel:</strong> Bireysel Aylık ₺350 / Yıllık ₺3.490 — Kurumsal Aylık ₺500 /
        Yıllık ₺4.990 (KDV dahildir).
      </li>
      <li><strong>Ödeme aracı:</strong> PayTR sanal POS aracılığıyla kredi/banka kartı.</li>
      <li><strong>Teslimat:</strong> Üyelik, ödeme onayının ardından derhal Alıcı’nın hesabında aktif edilir.</li>
    </ul>

    <h2>4. Otomatik Yenileme</h2>
    <p>
      Üyelik, Alıcı tarafından iptal edilmediği sürece seçilen periyot (aylık/yıllık) sonunda
      <strong> aynı tutar üzerinden otomatik olarak yenilenir</strong>. Alıcı, dilediği zaman
      hesabındaki <em>“Otomatik yenilemeyi kapat”</em> butonu ile yenilemeyi tek tıkla durdurabilir.
      Otomatik yenileme kapatıldığında mevcut dönem sonuna kadar Premium erişim devam eder, dönem
      sonunda hesap ücretsiz plana döner.
    </p>

    <h2>5. Cayma Hakkı (Önemli)</h2>
    <p>
      6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
      kapsamında; <strong>elektronik ortamda anında ifa edilen ve maddi olmayan dijital içerik
      ile hizmetler için cayma hakkı bulunmamaktadır</strong> (Yönetmelik m.15/1-ğ).
    </p>
    <p>
      Alıcı, ödeme adımında bu istisnayı açıkça kabul ettiğini ve üyeliğin satın alma anında
      derhal aktif edilmesini onayladığını beyan eder.
    </p>

    <h2>6. İptal ve İade</h2>
    <ul>
      <li>Otomatik yenileme istenildiği an hesaptan iptal edilebilir.</li>
      <li>
        Hatalı ödeme, çift çekim veya teknik nedenle hizmetten yararlanılamaması durumlarında
        Alıcı, destek@qrpark.xyz adresine başvurarak iade talep edebilir.
      </li>
      <li>
        İade, kabul edilen başvurularda 14 gün içinde, ödemenin yapıldığı kart hesabına yapılır.
      </li>
    </ul>

    <h2>7. Fatura</h2>
    <p>
      Satıcı, ödeme onayının ardından Alıcı’nın checkout sırasında belirttiği fatura bilgilerine
      istinaden e-Arşiv Fatura düzenler ve Alıcı’nın e-posta adresine iletir.
    </p>

    <h2>8. Mücbir Sebepler</h2>
    <p>
      Doğal afet, internet kesintisi, ödeme sağlayıcı kaynaklı arıza vb. mücbir sebep
      hallerinde Satıcı’nın yükümlülükleri askıya alınır.
    </p>

    <h2>9. Uyuşmazlıkların Çözümü</h2>
    <p>
      Sözleşme’den doğacak uyuşmazlıklarda, Ticaret Bakanlığı’nca her yıl ilan edilen parasal
      sınırlar dahilinde Tüketici Hakem Heyetleri ve aşan kısım için Tüketici Mahkemeleri
      yetkilidir.
    </p>

    <h2>10. Yürürlük</h2>
    <p>
      Alıcı, ödeme adımında bu sözleşmeyi okuyup onayladığını beyan eder. Onay anında
      Sözleşme yürürlüğe girer.
    </p>
  </StaticPageShell>
);

export default MesafeliSatis;