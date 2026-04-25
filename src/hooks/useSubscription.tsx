import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type SubscriptionState = {
  subscribed: boolean;
  planType: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    planType: null,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({ subscribed: false, planType: null, subscriptionEnd: null, loading: false });
      return;
    }

    try {
      // Retry up to 2 times on transient edge runtime errors (503 / network)
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (error) throw error;
          setState({
            subscribed: data?.subscribed ?? false,
            planType: data?.plan_type ?? null,
            subscriptionEnd: data?.subscription_end ?? null,
            loading: false,
          });
          return;
        } catch (err) {
          lastError = err;
          // Brief backoff before retry
          if (attempt < 2) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        }
      }
      // All retries failed — keep previous subscription state, just stop loading
      console.warn("check-subscription failed after retries:", lastError);
      setState((prev) => ({ ...prev, loading: false }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const isPremium = state.subscribed;

  return { ...state, isPremium, checkSubscription };
};
