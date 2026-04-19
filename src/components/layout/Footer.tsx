import { Car, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const legalLinks = [
  { to: "/privacy", label: "Gizlilik Politikası" },
  { to: "/terms", label: "Kullanım Şartları" },
  { to: "/kvkk", label: "KVKK" },
  { to: "/contact", label: "Bize Ulaşın" },
];

const Footer = () => {
  return (
    <footer className="border-t border-border py-10 mt-12">
      <div className="container mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-3 items-start">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Car className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-bold text-foreground">
                QR<span className="text-primary">Park</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-xs">
              Aracınızda iletişim sağlamanın en güvenli ve modern yolu.
            </p>
          </div>

          <nav aria-label="Yasal" className="md:justify-self-center">
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-3">
              Yasal & Destek
            </h3>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {legalLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:justify-self-end text-sm">
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-3">
              İletişim
            </h3>
            <a
              href="mailto:destek@qrpark.xyz"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4" />
              destek@qrpark.xyz
            </a>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} QRPark. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-muted-foreground">Türkiye'de tasarlandı</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
