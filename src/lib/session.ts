import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Session Supabase courante ; `pret` passe à vrai une fois la session lue. */
export function useSession(): { session: Session | null; pret: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setPret(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, pret };
}
