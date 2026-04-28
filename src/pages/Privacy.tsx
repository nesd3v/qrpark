import StaticPageShell from "@/components/layout/StaticPageShell";

const Privacy = () => (
  <StaticPageShell title="Gizlilik Politikası">
    <p>Son güncelleme: 28 Nisan 2026 · Sürüm 1.0</p>

    <p>
      QRPark (“biz”, “Veri Sorumlusu”) olarak kişisel verilerinizin gizliliğini en yüksek
      önemde tutuyoruz. Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”)
      ve ilgili mevzuat kapsamında, hizmetlerimizi kullanırken topladığımız verileri nasıl
      işlediğimizi açıklar.
    </p>

    <h2>1. Veri Sorumlusu</h2>
    <p>
      <strong>QRPark</strong><br />
      İletişim: <a href="mailto:destek@qrpark.xyz">destek@qrpark.xyz</a><br />
      Detaylı ticari bilgiler için <a href="/ticari-bilgi">Ticari Bilgi</a> sayfamıza
      bakabilirsiniz.
    </p>

    <h2>2. İşlenen Kişisel Veri Kategorileri</h2>
    <ul>
      <li>
        <strong>Kimlik verileri:</strong> ad-soyad
      </li>
      <li>
        <strong>İletişim verileri:</strong> e-posta adresi, telefon numarası
      </li>
      <li>
        <strong>Müşteri işlem verileri:</strong> abonelik kayıtları, ödeme tarihleri,
        fatura/teslimat bilgileri (TCKN/VKN, vergi dairesi, adres)
      </li>
      <li>
        <strong>Araç verileri:</strong> plaka, marka, model, renk, QR kod oluşturma kayıtları
      </li>
      <li>
        <strong>İşlem güvenliği verileri:</strong> IP adresi, oturum kayıtları, cihaz/tarayıcı
        bilgisi, oturum tokenları
      </li>
      <li>
        <strong>İletişim içeriği:</strong> destek talepleri, SMS bildirim metinleri (önceden
        tanımlı şablonlar)
      </li>
      <li>
        <strong>Pazarlama verileri:</strong> bülten, kampanya tercihleri (yalnızca onay
        verirseniz)
      </li>
    </ul>

    <h2>3. İşleme Amaçları ve Hukuki Sebepleri</h2>
    <table>
      <thead>
        <tr>
          <th>Amaç</th>
          <th>Hukuki Sebep (KVKK m.5)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Hesap oluşturma, kimlik doğrulama, oturum güvenliği</td>
          <td>Sözleşmenin kurulması ve ifası (m.5/2-c)</td>
        </tr>
        <tr>
          <td>Araç sahibine bildirim iletme, QR kod hizmeti</td>
          <td>Sözleşmenin ifası (m.5/2-c)</td>
        </tr>
        <tr>
          <td>Ödeme alma, fatura düzenleme, abonelik yönetimi</td>
          <td>Sözleşmenin ifası ve hukuki yükümlülük (m.5/2-c, m.5/2-ç)</td>
        </tr>
        <tr>
          <td>Vergi, ticari mevzuat ve TTK uyumu</td>
          <td>Hukuki yükümlülük (m.5/2-ç)</td>
        </tr>
        <tr>
          <td>Dolandırıcılık önleme, log kayıtları, sistem güvenliği</td>
          <td>Meşru menfaat (m.5/2-f)</td>
        </tr>
        <tr>
          <td>Pazarlama, kampanya bildirimi (SMS/e-posta)</td>
          <td>Açık rıza (m.5/1)</td>
        </tr>
        <tr>
          <td>Yurt dışı sunucularda veri barındırma</td>
          <td>Açık rıza (m.9)</td>
        </tr>
      </tbody>
    </table>

    <h2>4. Üçüncü Taraflar ve Aktarım</h2>
    <p>
      Verileriniz <strong>hiçbir üçüncü tarafa satılmaz</strong>. Hizmetin sunulabilmesi için
      zorunlu olduğu ölçüde aşağıdaki taraflarla paylaşılır:
    </p>
    <ul>
      <li>
        <strong>Twilio Inc. (ABD)</strong> — SMS doğrulama ve bildirim gönderimi.
        Aktarılan veri: telefon numarası, mesaj içeriği.
      </li>
      <li>
        <strong>PayTR Ödeme ve Elektronik Para Hizmetleri A.Ş. (Türkiye)</strong> —
        Ödeme işlemi. Aktarılan veri: ad-soyad, e-posta, telefon, fatura bilgileri,
        ödeme tutarı.
      </li>
      <li>
        <strong>Supabase / Lovable Cloud (AB / ABD)</strong> — Veri tabanı, dosya depolama
        ve uygulama altyapısı.
      </li>
      <li>
        <strong>Google AdSense (üretim ortamında)</strong> — Reklam gösterimi.
        Yalnızca anonim oturum/cihaz verisi.
      </li>
      <li>
        <strong>Yetkili kamu kurum ve kuruluşları</strong> — Yasal zorunluluk halinde
        (mahkeme kararı, kolluk talebi vb.).
      </li>
    </ul>

    <h2>5. Yurt Dışına Aktarım</h2>
    <p>
      Hizmet sağlayıcılarımızın bir kısmı (Twilio, Supabase, Google) verilerinizi
      ABD veya AB'de bulunan sunucularda işleyebilir. Bu aktarımlar KVKK m.9 kapsamında,
      <strong> açık rızanıza dayanılarak</strong> ve hizmetin verilebilmesi için zorunlu olduğu
      ölçüde gerçekleştirilir. Aktarımlar şifreli (TLS) kanallar üzerinden yapılır;
      sağlayıcılar sözleşmeleri ile yeterli güvenlik tedbirlerini taahhüt eder.
    </p>

    <h2>6. Saklama Süreleri</h2>
    <ul>
      <li>Hesap ve profil verileri: hesap aktif olduğu sürece</li>
      <li>Fatura, ödeme ve ticari kayıtlar: <strong>10 yıl</strong> (TTK ve VUK gereği)</li>
      <li>Log ve oturum kayıtları: <strong>2 yıl</strong></li>
      <li>SMS gönderim kayıtları: <strong>1 yıl</strong></li>
      <li>
        Hesap silme talebi sonrası: yasal saklama yükümlülüğü olmayan tüm veriler
        <strong> 30 gün içinde</strong> imha edilir.
      </li>
    </ul>

    <h2>7. Veri Güvenliği</h2>
    <ul>
      <li>Tüm trafik HTTPS / TLS üzerinden şifrelenir</li>
      <li>Şifreler endüstri standardı algoritmalarla hash'lenerek saklanır</li>
      <li>Destek mesajlaşması AES-256 ile şifrelenir</li>
      <li>Veri tabanı erişimi satır bazlı güvenlik (RLS) politikaları ile kısıtlanmıştır</li>
      <li>HIBP sızdırılmış parola koruması aktiftir</li>
      <li>Sızdırılmış parola tespiti durumunda kullanıcılar uyarılır</li>
    </ul>

    <h2>8. Çerezler</h2>
    <p>
      Uygulamamız oturum yönetimi için yalnızca <strong>zorunlu çerezler</strong>
      kullanır. Üçüncü taraf takip çerezi kullanmıyoruz. Detay için
      <a href="/cerez"> Çerez Politikamızı</a> inceleyebilirsiniz.
    </p>

    <h2>9. KVKK Kapsamındaki Haklarınız (m.11)</h2>
    <ul>
      <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
      <li>İşleniyorsa buna ilişkin bilgi talep etme</li>
      <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
      <li>Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme</li>
      <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
      <li>Silinmesini veya yok edilmesini talep etme</li>
      <li>İşleme itiraz etme</li>
      <li>Zarara uğramanız hâlinde tazminat talep etme</li>
    </ul>
    <p>
      Bu haklarınızı kullanmak için <a href="mailto:destek@qrpark.xyz">destek@qrpark.xyz</a>
      adresine yazılı başvuruda bulunabilirsiniz. Başvurunuz en geç <strong>30 gün</strong>
      içinde sonuçlandırılır.
    </p>

    <h2>10. Rıza Yönetimi</h2>
    <p>
      Profil sayfanızdaki <strong>“Rıza ve İletişim Tercihleri”</strong> bölümünden
      pazarlama izinlerinizi açıp kapatabilir, rıza geçmişinizi (denetim kaydı)
      görüntüleyebilirsiniz. Verdiğiniz tüm rızaları dilediğiniz zaman geri alabilirsiniz.
    </p>

    <h2>11. Politikadaki Değişiklikler</h2>
    <p>
      Bu politika ihtiyaç halinde güncellenebilir. Önemli değişiklikler kullanıcılara
      e-posta veya uygulama içi bildirim ile duyurulur. Güncel sürüm her zaman bu sayfada
      yayımlanır.
    </p>
  </StaticPageShell>
);

export default Privacy;
