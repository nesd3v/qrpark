import { Car, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const legalLinks = [
  { to: "/privacy", label: "Gizlilik Politikası" },
  { to: "/terms", label: "Kullanım Şartları" },
  { to: "/kvkk", label: "KVKK Aydınlatma" },
  { to: "/contact", label: "İletişim" },
];

const Footer = () => {
  return (
    <footer className="relative border-t border-border/70 py-14 mt-20">
      <div className="container mx-auto px-6">
        <div className="grid gap-10 md:grid-cols-3 items-start">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Car className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-display font-semibold tracking-tight text-foreground">
                QRPark
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Aracınızla iletişim kurmanın güvenli, kurumsal yolu.
            </p>
          </div>

          <nav aria-label="Yasal" className="md:justify-self-center">
            <h3 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-[0.18em] mb-4">
              Yasal
            </h3>
            <ul className="grid grid-cols-1 gap-y-2 text-sm">
              {legalLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:justify-self-end text-sm">
            <h3 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-[0.18em] mb-4">
              İletişim
            </h3>
            <a href="mailto:destek@qrpark.xyz" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Mail className="w-4 h-4" />
              destek@qrpark.xyz
            </a>
          </div>
        </div>

        <div className="border-t border-border/60 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} QRPark. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-muted-foreground">
            Türkiye'de tasarlandı.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
