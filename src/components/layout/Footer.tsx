import { Car, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const legalLinks = [
  { to: "/privacy", label: "Gizlilik" },
  { to: "/terms", label: "Şartlar" },
  { to: "/kvkk", label: "KVKK" },
  { to: "/contact", label: "İletişim" },
];

const Footer = () => {
  return (
    <footer className="relative border-t border-border/60 py-14 mt-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="container mx-auto px-6">
        <div className="grid gap-10 md:grid-cols-3 items-start">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="relative w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                <Car className="w-4.5 h-4.5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-display font-bold tracking-tight text-foreground">
                QR<span className="text-gradient-aurora">Park</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Aracınla iletişim kurmanın en güvenli ve en zarif yolu.
            </p>
          </div>

          <nav aria-label="Yasal" className="md:justify-self-center">
            <h3 className="font-mono text-[10px] font-semibold text-foreground/60 uppercase tracking-[0.2em] mb-4">
              // legal
            </h3>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
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
            <h3 className="font-mono text-[10px] font-semibold text-foreground/60 uppercase tracking-[0.2em] mb-4">
              // contact
            </h3>
            <a href="mailto:destek@qrpark.xyz" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Mail className="w-4 h-4" />
              destek@qrpark.xyz
            </a>
          </div>
        </div>

        <div className="border-t border-border/50 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} QRPark — Tüm hakları saklıdır.
          </p>
          <p className="text-xs font-mono text-muted-foreground/70">
            crafted in <span className="text-primary">İstanbul</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
