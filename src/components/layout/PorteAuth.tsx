import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { quiSuisJe, URL_DECONNEXION } from "@/lib/acces";

/**
 * La connexion se fait en amont, par Cloudflare Access (code reçu par email) ;
 * chaque fonction serveur revérifie son jeton. Cette porte ne fait que
 * l'attendre, et dit pourquoi la page reste vide si le serveur refuse.
 */
export function PorteAuth({ children }: { children: ReactNode }) {
  const moi = useQuery({ queryKey: ["moi"], queryFn: () => quiSuisJe(), retry: false });

  if (moi.isPending) return <div className="min-h-screen bg-background" />;
  if (moi.isError) return <EcranRefus />;
  return <>{children}</>;
}

function EcranRefus() {
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
          Cette session n'est pas reconnue. Reconnectez-vous avec l'adresse autorisée.
        </p>
      </div>
      <a
        href={URL_DECONNEXION}
        className="flex w-full max-w-xs items-center justify-center rounded-2xl bg-foreground py-4 text-base font-semibold text-background"
      >
        Se reconnecter
      </a>
    </main>
  );
}
