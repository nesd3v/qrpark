import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { recordSignupConsents } from "@/lib/recordSignupConsents";

// Track which user IDs have already had consent backfill attempted in this tab.
const consentBackfilled = new Set<string>();

const backfillConsents = (userId: string) => {
  if (consentBackfilled.has(userId)) return;
  consentBackfilled.add(userId);
  // Defer to avoid blocking the auth callback.
  setTimeout(() => {
    recordSignupConsents(userId);
  }, 0);
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (initialized) setLoading(false);
      if (session?.user) backfillConsents(session.user.id);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      initialized = true;
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) backfillConsents(session.user.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
};
