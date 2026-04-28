import StaticPageShell from "@/components/layout/StaticPageShell";

const AcikRiza = () => (
  <StaticPageShell title="Açık Rıza Metni">
    <p>Son güncelleme: 28 Nisan 2026</p>

    <p>
      6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) m. 5/1 ve m. 6/2 kapsamında,
      QRPark (“Veri Sorumlusu”) tarafından aşağıda belirtilen amaçlarla kişisel verilerimin
      işlenmesine ve aktarılmasına özgür irademle <strong>açık rıza</strong> veriyorum.
    </p>

    <h2>1. İşlenen Veriler</h2>
    <ul>
      <li>Kimlik ve iletişim verileri: ad-soyad, telefon, e-posta</li>
      <li>Araç verileri: plaka, marka, model, renk</li>
      <li>Müşteri işlem verileri: abonelik, ödeme, fatura bilgileri</li>
      <li>İşlem güvenliği verileri: IP, cihaz, log kayıtları</li>
    </ul>

    <h2>2. İşleme Amaçları</h2>
    <ul>
      <li>QR kod aracılığıyla araç sahibi ile iletişim sağlanması</li>
      <li>SMS doğrulama, oturum güvenliği ve hesap yönetimi</li>
      <li>Premium abonelik ve ödeme süreçlerinin yürütülmesi</li>
      <li>Yasal yükümlülüklerin (fatura, vergi, mevzuat) yerine getirilmesi</li>
      <li>Hizmet kalitesinin iyileştirilmesi ve müşteri desteği</li>
    </ul>

    <h2>3. Aktarım</h2>
    <p>
      Kişisel verileriniz, hizmetin yürütülmesi için zorunlu olduğu ölçüde aşağıdaki
      taraflarla paylaşılır:
    </p>
    <ul>
      <li><strong>Twilio Inc. (ABD)</strong> – SMS gönderimi</li>
      <li><strong>PayTR Ödeme ve Elektronik Para Hizmetleri A.Ş.</strong> – Ödeme işlemleri</li>
      <li><strong>Supabase / Lovable Cloud</strong> – Veri barındırma altyapısı</li>
      <li>Yasal mercilere talep halinde mevzuat gereği</li>
    </ul>
    <p>
      Yurt dışına aktarımlar KVKK m. 9 kapsamında, hizmetin sağlanabilmesi için zorunlu
      olduğundan açık rızanıza istinaden gerçekleştirilmektedir.
    </p>

    <h2>4. Saklama Süresi</h2>
    <p>
      Verileriniz, hesabınız aktif olduğu sürece ve yasal saklama süreleri (TTK, VUK kapsamında
      en az 10 yıl fatura/ödeme verisi) boyunca saklanır. Hesabınız silindiğinde, yasal
      saklama yükümlülüğü olmayan tüm veriler 30 gün içinde imha edilir.
    </p>

    <h2>5. Haklarınız (KVKK m. 11)</h2>
    <ul>
      <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
      <li>İşlenmişse buna ilişkin bilgi talep etme</li>
      <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
      <li>Silinmesini veya yok edilmesini isteme</li>
      <li>İşleme itiraz etme</li>
      <li>Zarara uğramanız hâlinde tazminat talep etme</li>
    </ul>

    <h2>6. Rıza Geri Alma</h2>
    <p>
      Bu açık rızayı dilediğiniz zaman <a href="mailto:destek@qrpark.xyz">destek@qrpark.xyz</a>
      adresine yazılı bildirimle geri alabilirsiniz. Rıza geri alındığında ilgili veri işleme
      faaliyetleri durdurulur; ancak yasal saklama yükümlülükleri devam edebilir.
    </p>

    <h2>7. İletişim</h2>
    <p>
      Veri Sorumlusu: <strong>QRPark</strong><br />
      E-posta: <a href="mailto:destek@qrpark.xyz">destek@qrpark.xyz</a>
    </p>
  </StaticPageShell>
);

export default AcikRiza;