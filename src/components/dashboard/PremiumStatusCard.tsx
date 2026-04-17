import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PremiumStatusCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, planType, subscriptionEnd, loading } = useSubscription();
  const [isCorporate, setIsCorporate] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("corporate_members")
      .select("company_name, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setIsCorporate(true);
          setCompanyName(data.company_name);
        }
      });
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 animate-pulse h-20" />
    );
  }

  // CORPORATE
  if (isCorporate) {
    return (
      <motion.button
        onClick={() => navigate("/corporate-dashboard")}
        className="w-full rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 flex items-center gap-3 text-left"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Kurumsal Üye</p>
          <p className="font-display font-bold text-foreground truncate">{companyName}</p>
          <p className="text-[11px] text-muted-foreground">Filo Paneline Git</p>
        </div>
        <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
      </motion.button>
    );
  }

  // PREMIUM ACTIVE
  if (isPremium) {
    const daysLeft = subscriptionEnd
      ? Math.max(0, Math.ceil((new Date(subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    return (
      <motion.button
        onClick={() => navigate("/subscription")}
        className="w-full rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 flex items-center gap-3 text-left"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Premium Aktif</p>
          <p className="font-display font-bold text-foreground truncate">
            {planType === "yearly" ? "Yıllık Plan" : "Aylık Plan"}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {daysLeft !== null ? `${daysLeft} gün kaldı` : "Aktif"}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
      </motion.button>
    );
  }

  // FREE
  return (
    <motion.button
      onClick={() => navigate("/pricing")}
      className="w-full rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-left hover:border-primary/30 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Crown className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Ücretsiz Plan</p>
        <p className="font-display font-bold text-foreground">Premium'a Geç</p>
        <p className="text-[11px] text-primary font-medium">Aylık ₺49 / Yıllık ₺499</p>
      </div>
      <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
    </motion.button>
  );
};

export default PremiumStatusCard;
