import StaticPageShell from "@/components/layout/StaticPageShell";

const Cayma = () => (
  <StaticPageShell title="Cayma Hakkı ve İade">
    <p className="text-xs text-muted-foreground">Son güncelleme: 28.04.2026</p>

    <h2>Cayma Hakkı İstisnası</h2>
    <p>
      QRPark Premium üyeliği, satın alma anında derhal aktive edilen <strong>dijital bir
      hizmettir</strong>. 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
      Sözleşmeler Yönetmeliği’nin <strong>15. maddesinin 1/ğ bendi</strong> uyarınca,
      elektronik ortamda anında ifa edilen hizmetler ve dijital içerikler için tüketicinin
      <strong> cayma hakkı bulunmamaktadır</strong>.
    </p>
    <p>
      Bu nedenle satın alma onayı sonrasında ücret iadesi <strong>kural olarak yapılmaz</strong>.
      Ancak aşağıdaki durumlarda iade talebinde bulunabilirsiniz:
    </p>
    <ul>
      <li>Aynı işlem için <strong>çift çekim</strong> yapılması</li>
      <li>Hatalı tutarda tahsilat</li>
      <li>Hizmetin teknik nedenlerle teslim edilememesi</li>
      <li>Kabul edilmemiş otomatik yenileme</li>
    </ul>

    <h2>İade Süreci</h2>
    <ol>
      <li>destek@qrpark.xyz adresine talebinizi iletin (sipariş numarası, tarih).</li>
      <li>Talebiniz 3 iş günü içinde değerlendirilir.</li>
      <li>Onaylanan iadeler, ödemenin yapıldığı karta <strong>14 gün içinde</strong> yapılır.</li>
    </ol>

    <h2>Otomatik Yenilemenin İptali</h2>
    <p>
      Üyeliğinizin sonraki dönemde yenilenmesini istemiyorsanız, hesap sayfanızdaki
      <em> “Otomatik yenilemeyi kapat”</em> butonunu kullanabilirsiniz. Bu işlem mevcut
      üyelik sürenizi etkilemez; süre sonunda hesabınız ücretsiz plana döner.
    </p>
  </StaticPageShell>
);

export default Cayma;