import StaticPageShell from "@/components/layout/StaticPageShell";

const Cerez = () => (
  <StaticPageShell title="Çerez (Cookie) Politikası">
    <p className="text-xs text-muted-foreground">Son güncelleme: 28.04.2026</p>

    <h2>1. Çerez Nedir?</h2>
    <p>
      Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza yerleştirilen küçük
      metin dosyalarıdır. Sitenin düzgün çalışmasını sağlar, oturumunuzu hatırlar ve
      kullanım deneyimini iyileştirir.
    </p>

    <h2>2. Kullandığımız Çerez Türleri</h2>
    <ul>
      <li>
        <strong>Zorunlu çerezler:</strong> Oturum açma, güvenlik, sayfa geçişleri için
        gereklidir. Onay gerektirmez.
      </li>
      <li>
        <strong>İşlevsel çerezler:</strong> Tema/dil tercihinizi, son ziyaret edilen
        sayfayı hatırlar.
      </li>
      <li>
        <strong>Analitik çerezler:</strong> Anonim trafik istatistikleri için kullanılır
        (yalnızca onayınızla).
      </li>
      <li>
        <strong>Reklam çerezleri:</strong> Yayınlanması durumunda yalnızca açık
        rızanızla aktif olur.
      </li>
    </ul>

    <h2>3. Üçüncü Taraf Çerezleri</h2>
    <ul>
      <li><strong>Supabase</strong> — oturum yönetimi (zorunlu)</li>
      <li><strong>PayTR</strong> — ödeme adımı (zorunlu, yalnızca ödeme akışında)</li>
      <li><strong>Google AdSense</strong> — reklam kişiselleştirme (yalnızca açık rıza ile)</li>
    </ul>

    <h2>4. Çerez Tercihinizi Yönetme</h2>
    <p>
      Çerez onayınızı sayfanın altındaki çerez bandından her zaman güncelleyebilir veya
      tarayıcınızın ayarlarından çerezleri silebilirsiniz. Zorunlu çerezler reddedilirse
      sitenin bazı bölümleri çalışmayabilir.
    </p>

    <h2>5. KVKK ile İlişkisi</h2>
    <p>
      Çerezler aracılığıyla işlenen kişisel veriler için KVKK Aydınlatma Metnimiz geçerlidir.
      Detaylı bilgi için <a href="/kvkk">KVKK Aydınlatma Metni</a> sayfamızı inceleyiniz.
    </p>
  </StaticPageShell>
);

export default Cerez;