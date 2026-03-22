import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Car, MailX, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Unsubscribe = () => {
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [token, setToken] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);

    if (!t) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${t}`, {
          headers: { apikey: anonKey },
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          setStatus("valid");
        } else if (data.reason === "already_unsubscribed") {
          setStatus("already");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, []);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold text-foreground">
            QR<span className="text-primary">Park</span>
          </span>
        </Link>

        <div className="glass rounded-2xl p-8">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground">Doğrulanıyor...</p>
            </div>
          )}

          {status === "valid" && (
            <div className="flex flex-col items-center gap-4">
              <MailX className="w-12 h-12 text-muted-foreground" />
              <h1 className="text-xl font-display font-bold text-foreground">Abonelikten Çık</h1>
              <p className="text-muted-foreground text-sm">
                E-posta bildirimlerinden çıkmak istediğinize emin misiniz?
              </p>
              <Button
                onClick={handleUnsubscribe}
                disabled={processing}
                className="w-full gradient-primary text-primary-foreground font-semibold py-5"
              >
                {processing ? "İşleniyor..." : "Abonelikten Çık"}
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="w-12 h-12 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground">Başarılı</h1>
              <p className="text-muted-foreground text-sm">
                E-posta bildirimlerinden başarıyla çıkış yaptınız.
              </p>
            </div>
          )}

          {status === "already" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground" />
              <h1 className="text-xl font-display font-bold text-foreground">Zaten Çıkış Yapılmış</h1>
              <p className="text-muted-foreground text-sm">
                Bu e-posta adresinden zaten çıkış yapılmış.
              </p>
            </div>
          )}

          {status === "invalid" && (
            <div className="flex flex-col items-center gap-4">
              <MailX className="w-12 h-12 text-destructive" />
              <h1 className="text-xl font-display font-bold text-foreground">Geçersiz Bağlantı</h1>
              <p className="text-muted-foreground text-sm">
                Bu abonelik çıkış bağlantısı geçersiz veya süresi dolmuş.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <MailX className="w-12 h-12 text-destructive" />
              <h1 className="text-xl font-display font-bold text-foreground">Bir Hata Oluştu</h1>
              <p className="text-muted-foreground text-sm">
                İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.
              </p>
              <Button onClick={handleUnsubscribe} variant="outline" className="w-full">
                Tekrar Dene
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Unsubscribe;
