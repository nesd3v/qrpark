import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "./useSubscription";
import { haptic } from "./useNative";

/**
 * Auto-activate the latest pending PayTR subscription when user is redirected to
 * `?checkout=success`. Acts as a fallback for the server-to-server callback that
 * may not reach our backend in test/sandbox environments.
 */
export const usePaytrCheckoutHandler = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkSubscription } = useSubscription();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const status = params.get("checkout");
    if (!status) return;
    handled.current = true;

    (async () => {
      if (status === "success") {
        try {
          const { data, error } = await supabase.functions.invoke("verify-paytr-payment");
          if (error) throw error;
          if (data?.activated) {
            haptic.success();
            toast.success("Premium aboneliğin aktif edildi! 🎉");
            await checkSubscription();
          } else {
            // No pending sub — likely already activated by callback
            await checkSubscription();
          }
        } catch (e) {
          console.warn("verify-paytr-payment failed", e);
          await checkSubscription();
        }
      } else if (status === "failed") {
        haptic.error();
        toast.error("Ödeme tamamlanamadı");
      }

      // Clean URL
      const next = new URLSearchParams(location.search);
      next.delete("checkout");
      const qs = next.toString();
      navigate(`${location.pathname}${qs ? `?${qs}` : ""}`, { replace: true });
    })();
  }, [params, checkSubscription, navigate, location.pathname, location.search]);
};
