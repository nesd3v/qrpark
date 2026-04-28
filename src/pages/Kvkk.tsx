import StaticPageShell from "@/components/layout/StaticPageShell";

const Kvkk = () => (
  <StaticPageShell title="KVKK Aydınlatma Metni">
    <p className="text-xs text-muted-foreground">Son güncelleme: 28.04.2026</p>

    <h2>1. Veri Sorumlusunun Kimliği</h2>
    <p>
      6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusu
      sıfatıyla <strong>QRPark</strong> hareket etmektedir. İletişim:
      <strong> destek@qrpark.xyz</strong>
    </p>

    <h2>2. İşlenen Kişisel Veri Kategorileri</h2>
    <ul>
      <li><strong>Kimlik:</strong> Ad, soyad</li>
      <li><strong>İletişim:</strong> Cep telefonu, e-posta adresi</li>
      <li><strong>Araç:</strong> Plaka, marka, model, renk</li>
      <li><strong>Müşteri işlem:</strong> Üyelik tipi, ödeme tarihi, fatura bilgileri (TCKN/VKN, vergi dairesi, fatura adresi)</li>
      <li><strong>İşlem güvenliği:</strong> IP adresi, cihaz/oturum bilgisi, log kayıtları</li>
      <li><strong>Bildirim içeriği:</strong> QR üzerinden gönderilen bildirimlerin metni ve zamanı</li>
    </ul>

    <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
    <ul>
      <li>Üyelik oluşturma, kimlik doğrulama (Twilio SMS OTP)</li>
      <li>QR kod üzerinden bildirim/iletişim hizmetinin sunulması</li>
      <li>Premium aboneliğin yönetimi, ödeme ve faturalandırma süreçleri</li>
      <li>Yasal yükümlülüklerin yerine getirilmesi (e-Arşiv Fatura, Vergi Usul Kanunu, KVKK, ETBİS)</li>
      <li>Bilgi güvenliği, hile/dolandırıcılık önleme</li>
      <li>Hizmet kalitesinin iyileştirilmesi ve istatistiksel analiz</li>
    </ul>

    <h2>4. İşlemenin Hukuki Sebepleri</h2>
    <p>Kişisel verileriniz; KVKK m.5 ve m.6 kapsamında aşağıdaki hukuki sebeplerle işlenir:</p>
    <ul>
      <li>Sözleşmenin kurulması ve ifası için zorunlu olması (üyelik / abonelik sözleşmesi)</li>
      <li>Kanunlarda açıkça öngörülmesi (VUK, 6502, 6563, 6493 sayılı Kanun)</li>
      <li>Veri sorumlusunun meşru menfaati (güvenlik, dolandırıcılık önleme)</li>
      <li>Açık rıza (pazarlama amaçlı iletişim, opsiyonel çerezler)</li>
    </ul>

    <h2>5. Aktarım</h2>
    <p>Kişisel verileriniz aşağıdaki üçüncü taraflara işbu Aydınlatma Metni amaçlarıyla sınırlı olarak aktarılır:</p>
    <ul>
      <li><strong>Twilio</strong> (SMS gönderimi)</li>
      <li><strong>PayTR</strong> (ödeme tahsilatı)</li>
      <li><strong>Resend</strong> (transactional e-posta)</li>
      <li><strong>Supabase / Lovable Cloud</strong> (barındırma altyapısı)</li>
      <li>Yasal makamlar (talep edilmesi halinde)</li>
    </ul>

    <h2>6. Saklama Süreleri</h2>
    <ul>
      <li>Üyelik verisi: Üyelik aktif olduğu sürece + 10 yıl (TBK zamanaşımı)</li>
      <li>Fatura verisi: VUK gereği 5 yıl</li>
      <li>OTP / log kayıtları: 1 yıl</li>
      <li>Bildirim metinleri: AES-256 şifreli, 90 gün</li>
    </ul>

    <h2>7. Haklarınız (KVKK m.11)</h2>
    <p>Veri sahibi olarak; öğrenme, erişme, düzeltme, silme/yok etme, aktarım bilgisi
    talep etme, otomatik analiz sonuçlarına itiraz ve zararın giderilmesini talep
    haklarına sahipsiniz. Başvurularınızı <strong>destek@qrpark.xyz</strong> adresine
    yapabilirsiniz. Talepleriniz en geç <strong>30 gün</strong> içinde sonuçlandırılır.</p>

    <h2>8. Veri Güvenliği</h2>
    <p>
      Tüm veriler şifreli iletim (TLS) ile aktarılır, hassas bildirim içerikleri AES-256 ile
      şifreli olarak saklanır. Erişim, görev gereği yetkilendirilmiş personelle sınırlıdır.
    </p>
  </StaticPageShell>
);

export default Kvkk;
