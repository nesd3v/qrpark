import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "qrpark_cookie_consent_v1";

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage may be blocked
    }
  }, []);

  const persist = (value: "all" | "essential") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, ts: Date.now() })
      );
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-[60] glass rounded-2xl p-4 shadow-2xl"
      role="dialog"
      aria-label="Çerez tercihleri"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Cookie className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-display font-bold text-foreground">
              Çerez tercihleri
            </h3>
            <button
              onClick={() => persist("essential")}
              className="p-1 -mt-1 -mr-1 text-muted-foreground hover:text-foreground"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Sitenin çalışması için zorunlu çerezleri kullanıyoruz. Analitik ve reklam
            çerezleri yalnızca onayınızla aktif olur.{" "}
            <Link to="/cerez" className="text-primary hover:underline">
              Detaylı bilgi
            </Link>
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => persist("essential")}
              className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Yalnızca zorunlu
            </button>
            <button
              onClick={() => persist("all")}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              Tümünü kabul et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;