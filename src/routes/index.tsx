import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Fuel, Plus, Settings } from "lucide-react";
import { toast } from "sonner";

import { FicheSheet } from "@/components/fiches/FicheSheet";
import { ListeFiches } from "@/components/fiches/ListeFiches";
import { BarreRecherche } from "@/components/layout/BarreRecherche";
import { Icone } from "@/components/layout/Icone";
import { PorteAuth } from "@/components/layout/PorteAuth";
import {
  useEnregistrerFiche,
  useFiches,
  useNoter,
  useRubriques,
  useSupprimerFiche,
} from "@/lib/api";
import { chercher, couleurDe, formatEuros, trier, type Fiche } from "@/lib/fiches";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Boîte noire" },
      {
        name: "description",
        content:
          "L'enregistreur de ce que vous vivez : concerts, spectacles et tout ce que vous y ajoutez.",
      },
    ],
  }),
  component: () => (
    <PorteAuth>
      <Accueil />
    </PorteAuth>
  ),
});

function Accueil() {
  const navigate = useNavigate();
  const { data: rubriques = [] } = useRubriques();
  const { data: fiches = [], isLoading } = useFiches();
  const enregistrer = useEnregistrerFiche();
  const supprimer = useSupprimerFiche();
  const noter = useNoter();

  const [recherche, setRecherche] = useState("");
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<Fiche | null>(null);

  const resultats = useMemo(
    () => (recherche.trim() ? trier(chercher(fiches, recherche), "date_desc") : []),
    [fiches, recherche],
  );

  const aujourdhui = new Date().toISOString().slice(0, 10);
  const aVenir = useMemo(
    () =>
      trier(
        fiches.filter((f) => f.date && f.date >= aujourdhui && f.statut !== "annule"),
        "date_asc",
      ).slice(0, 4),
    [fiches, aujourdhui],
  );
  const dernieres = useMemo(
    () =>
      trier(
        fiches.filter((f) => f.statut === "vu" && f.date && f.date < aujourdhui),
        "date_desc",
      ).slice(0, 5),
    [fiches, aujourdhui],
  );

  const vus = fiches.filter((f) => f.statut === "vu");
  const depense = vus.reduce((s, f) => s + Number(f.prix ?? 0), 0);

  function ouvrirNouvelle() {
    setEnEdition(null);
    setFeuilleOuverte(true);
  }

  function ouvrir(f: Fiche) {
    setEnEdition(f);
    setFeuilleOuverte(true);
  }

  return (
    <main className="safe-top safe-bottom min-h-screen px-4 pb-32">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold tracking-tight">Boîte noire</h1>
        <Link
          to="/reglages"
          className="rounded-full bg-secondary p-2.5 text-muted-foreground"
          aria-label="Réglages"
        >
          <Settings className="size-4" />
        </Link>
      </header>

      <BarreRecherche
        valeur={recherche}
        onChange={setRecherche}
        placeholder="Chercher dans tout l'historique…"
      />

      {recherche.trim() ? (
        <section className="mt-5">
          <p className="mb-3 px-1 text-xs text-muted-foreground">
            {resultats.length} résultat{resultats.length > 1 ? "s" : ""}
          </p>
          <ListeFiches
            fiches={resultats}
            rubriques={rubriques}
            montrerRubrique
            onOuvrir={ouvrir}
            onNoter={(f, note) => noter.mutate({ id: f.id, note })}
            vide="Rien ne correspond à cette recherche."
          />
        </section>
      ) : (
        <>
          <section className="mt-4 grid grid-cols-3 gap-3">
            <Chiffre valeur={String(vus.length)} legende="vécus" />
            <Chiffre valeur={String(fiches.length - vus.length)} legende="à venir / envies" />
            <Chiffre valeur={depense > 0 ? formatEuros(depense) : "—"} legende="dépensé" />
          </section>

          <section className="mt-6">
            <h2 className="mb-3 px-1 text-sm font-medium text-muted-foreground">Rubriques</h2>
            <div className="grid grid-cols-2 gap-3">
              {rubriques.map((r) => {
                const couleur = couleurDe(r.couleur);
                const total = fiches.filter((f) => f.rubrique_id === r.id).length;
                return (
                  <Link
                    key={r.id}
                    to="/r/$slug"
                    params={{ slug: r.slug }}
                    className="card-surface flex flex-col gap-3 p-4 active:scale-[0.98]"
                  >
                    <span
                      className={`flex size-11 items-center justify-center rounded-2xl ${couleur.fond} ${couleur.texte}`}
                    >
                      <Icone nom={r.icone} className="size-5" />
                    </span>
                    <span>
                      <span className="block font-semibold">{r.nom}</span>
                      <span className="num block text-xs text-muted-foreground">
                        {total} fiche{total > 1 ? "s" : ""}
                      </span>
                    </span>
                  </Link>
                );
              })}

              <Link
                to="/carburant"
                className="card-surface flex flex-col gap-3 p-4 active:scale-[0.98]"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Fuel className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">Carburant</span>
                  <span className="block text-xs text-muted-foreground">Conso camping-car</span>
                </span>
              </Link>
            </div>

            {rubriques.length === 0 && !isLoading && (
              <div className="card-surface mt-3 p-5 text-center text-sm text-muted-foreground">
                Aucune rubrique pour l'instant.{" "}
                <Link to="/reglages" className="text-primary underline">
                  Créez-en une ou importez vos données
                </Link>
                .
              </div>
            )}
          </section>

          {aVenir.length > 0 && (
            <section className="mt-7">
              <h2 className="mb-3 px-1 text-sm font-medium text-muted-foreground">Ça arrive</h2>
              <ListeFiches
                fiches={aVenir}
                rubriques={rubriques}
                montrerRubrique
                onOuvrir={ouvrir}
                onNoter={(f, note) => noter.mutate({ id: f.id, note })}
                vide="Rien de prévu."
              />
            </section>
          )}

          {dernieres.length > 0 && (
            <section className="mt-7">
              <h2 className="mb-3 px-1 text-sm font-medium text-muted-foreground">
                Derniers vécus
              </h2>
              <ListeFiches
                fiches={dernieres}
                rubriques={rubriques}
                montrerRubrique
                onOuvrir={ouvrir}
                onNoter={(f, note) => noter.mutate({ id: f.id, note })}
                vide="Rien encore."
              />
            </section>
          )}
        </>
      )}

      <button
        onClick={ouvrirNouvelle}
        aria-label="Ajouter une fiche"
        className="fixed right-5 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-fab)] active:scale-95"
      >
        <Plus className="size-8" strokeWidth={2.5} />
      </button>

      <FicheSheet
        ouvert={feuilleOuverte}
        fiche={enEdition}
        rubriques={rubriques}
        rubriqueParDefaut={null}
        enregistrement={enregistrer.isPending || supprimer.isPending}
        onFermer={() => {
          setFeuilleOuverte(false);
          setEnEdition(null);
        }}
        onEnregistrer={(valeurs) => {
          if (rubriques.length === 0) {
            toast.error("Créez d'abord une rubrique dans les réglages.");
            void navigate({ to: "/reglages" });
            return;
          }
          enregistrer.mutate(enEdition ? { id: enEdition.id, valeurs } : { valeurs }, {
            onSuccess: () => {
              setFeuilleOuverte(false);
              setEnEdition(null);
              toast.success(enEdition ? "Fiche modifiée" : "Fiche ajoutée");
            },
            onError: () => toast.error("Enregistrement impossible. Réessayez."),
          });
        }}
        onSupprimer={(f) =>
          supprimer.mutate(f.id, {
            onSuccess: () => {
              setFeuilleOuverte(false);
              setEnEdition(null);
              toast.success("Fiche supprimée");
            },
            onError: () => toast.error("Suppression impossible."),
          })
        }
      />
    </main>
  );
}

function Chiffre({ valeur, legende }: { valeur: string; legende: string }) {
  return (
    <div className="card-surface p-4">
      <p className="num text-xl font-bold">{valeur}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{legende}</p>
    </div>
  );
}
