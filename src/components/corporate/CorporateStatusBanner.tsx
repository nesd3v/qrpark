import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

type Inquiry = {
  id: string;
  status: string;
  payment_status: string;
  company_name: string;
};

type State =
  | { kind: "none" }
  | { kind: "pending_payment"; inquiry: Inquiry }
  | { kind: "active" };

/**
 * Tüm uygulamada gösterilebilecek, kurumsal başvuru/ödeme durumunu
 * özetleyen küçük banner. Hiçbir aktif durumu yoksa hiçbir şey render etmez.
 */
const CorporateStatusBanner = ({ compact = false }: { compact?: boolean }) => {
  const { user } = useAuth();
  const { isCorporatePremium } = useSubscription();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "none" });
  const [dismissedActive, setDismissedActive] = useState(false);

  useEffect(() => {
    if (!user) {
      setState({ kind: "none" });
      return;
    }
    (async () => {
      // 1) Ödeme bekleniyor mu?
      const { data: pending } = await supabase
        .from("corporate_inquiries" as any)
        .select("id, status, payment_status, company_name")
        .eq("user_id", user.id)
        .eq("payment_status", "pending_payment")
        .in("status", ["approved", "completed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pending) {
        setState({ kind: "pending_payment", inquiry: pending as any });
        return;
      }
      // 2) Yeni aktifleşmiş bir kurumsal üyelik var mı?
      if (isCorporatePremium) {
        // Son 7 gün içinde paid olmuş başvuru → "Aktif üye" tebriği
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: paid } = await supabase
          .from("corporate_inquiries" as any)
          .select("id, status, payment_status, company_name")
          .eq("user_id", user.id)
          .eq("payment_status", "paid")
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (paid) {
          const seen = localStorage.getItem(`corp-active-seen-${(paid as any).id}`);
          if (!seen) setState({ kind: "active" });
        }
      }
    })();
  }, [user, isCorporatePremium]);

  if (state.kind === "none" || (state.kind === "active" && dismissedActive)) return null;

  if (state.kind === "pending_payment") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 ${compact ? "text-xs" : "text-sm"}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">
              Kurumsal başvurunuz onaylandı — ödeme bekleniyor
            </p>
            <p className="text-muted-foreground mt-0.5">
              {state.inquiry.company_name} için Kurumsal Premium aboneliğinizi başlatmak için ödemeyi tamamlayın.
            </p>
            <button
              onClick={() => navigate("/pricing")}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline"
            >
              Ödemeye git <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // active
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 ${compact ? "text-xs" : "text-sm"}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground">
            🎉 Kurumsal Premium aktifleşti — Aktif üye
          </p>
          <p className="text-muted-foreground mt-0.5">
            Kurumsal panele ve sınırsız araç yönetimine erişebilirsiniz.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => navigate("/corporate")}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
            >
              <Building2 className="w-3 h-3" /> Kurumsal panele git
            </button>
            <button
              onClick={() => setDismissedActive(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CorporateStatusBanner;