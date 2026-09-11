import type { ReactNode } from "react";
import { useState } from "react";
import { Apple } from "lucide-react";
import { toast } from "sonner";

import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/session";

/**
 * Rien n'est accessible sans compte Apple : la connexion est l'unique porte
 * d'entrée, et la RLS côté Postgres garantit que chacun ne voit que ses
 * propres données même si quelqu'un parlait directement à l'API.
 */
export function PorteAuth({ children }: { children: ReactNode }) {
  const { session, pret } = useSession();

  if (!pret) return <div className="min-h-screen bg-background" />;
  if (!session) return <EcranConnexion />;
  return <>{children}</>;
}

function EcranConnexion() {
  const [enCours, setEnCours] = useState(false);

  async function connexion() {
    setEnCours(true);
    const resultat = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (resultat.error) {
      setEnCours(false);
      toast.error("Connexion impossible. Réessayez.");
      return;
    }
    if (resultat.redirected) return;
    setEnCours(false);
  }

  return (
    <main className="safe-top safe-bottom flex min-h-screen flex-col items-center justify-center gap-10 px-8">
      <div className="text-center">
        <img
          src="/icons/icon-512.png"
          alt=""
          width={88}
          height={88}
          className="mx-auto mb-6 size-22 rounded-[1.75rem]"
        />
        <h1 className="text-4xl font-bold tracking-tight">Boîte noire</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          L'enregistreur de ce que vous vivez : concerts, spectacles, et tout ce que vous y
          ajouterez.
        </p>
      </div>
      <button
        onClick={() => void connexion()}
        disabled={enCours}
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-base font-semibold text-background disabled:opacity-60"
      >
        <Apple className="size-5" />
        {enCours ? "Connexion…" : "Se connecter avec Apple"}
      </button>
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Accès réservé à votre compte Apple. Aucune autre méthode de connexion n'est ouverte.
      </p>
    </main>
  );
}
