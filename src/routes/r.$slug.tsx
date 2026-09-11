import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, SlidersHorizontal } from "lucide-react";
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
import {
  chercher,
  couleurDe,
  formatEuros,
  LIBELLE_STATUT,
  LIBELLE_TRI,
  STATUTS,
  trier,
  type Fiche,
  type StatutFiche,
  type Tri,
} from "@/lib/fiches";

export const Route = createFileRoute("/r/$slug")({
  ssr: false,
  component: () => (
    <PorteAuth>
      <PageRubrique />
    </PorteAuth>
  ),
});

const TRIS: Tri[] = ["date_desc", "date_asc", "note_desc", "titre"];

function PageRubrique() {
  const { slug } = Route.useParams();
  const { data: rubriques = [], isLoading: chargeRubriques } = useRubriques();
  const { data: fiches = [] } = useFiches();
  const enregistrer = useEnregistrerFiche();
  const supprimer = useSupprimerFiche();
  const noter = useNoter();

  const [recherche, setRecherche] = useState("");
  const [statuts, setStatuts] = useState<StatutFiche[]>([]);
  const [tagActif, setTagActif] = useState<string | null>(null);
  const [tri, setTri] = useState<Tri>("date_desc");
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<Fiche | null>(null);

  const rubrique = rubriques.find((r) => r.slug === slug);
  const toutes = useMemo(
    () => (rubrique ? fiches.filter((f) => f.rubrique_id === rubrique.id) : []),
    [fiches, rubrique],
  );

  const tagsFrequents = useMemo(() => {
    const compte = new Map<string, number>();
    for (const f of toutes) for (const t of f.tags) compte.set(t, (compte.get(t) ?? 0) + 1);
    return [...compte.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([t]) => t);
  }, [toutes]);

  const visibles = useMemo(() => {
    let liste = toutes;
    if (statuts.length > 0) liste = liste.filter((f) => statuts.includes(f.statut));
    if (tagActif) liste = liste.filter((f) => f.tags.includes(tagActif));
    return trier(chercher(liste, recherche, rubriques), tri);
  }, [toutes, statuts, tagActif, recherche, tri, rubriques]);

  const vus = toutes.filter((f) => f.statut === "vu");
  const notees = toutes.filter((f) => f.note != null);
  const moyenne =
    notees.length > 0 ? notees.reduce((s, f) => s + (f.note ?? 0), 0) / notees.length : null;
  const depense = vus.reduce((s, f) => s + Number(f.prix ?? 0), 0);

  if (!rubrique) {
    return (
      <main className="safe-top safe-bottom flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          {chargeRubriques ? "Chargement…" : "Cette rubrique n'existe pas (ou plus)."}
        </p>
        {!chargeRubriques && (
          <Link to="/" className="rounded-2xl bg-secondary px-5 py-3 text-sm font-medium">
            Retour à l'accueil
          </Link>
        )}
      </main>
    );
  }

  const couleur = couleurDe(rubrique.couleur);
  const filtresActifs = statuts.length > 0 || tagActif !== null || tri !== "date_desc";

  return (
    <main className="safe-top safe-bottom min-h-screen px-4 pb-32">
      <header className="flex items-center gap-3 py-4">
        <Link
          to="/"
          className="rounded-full bg-secondary p-2.5 text-muted-foreground"
          aria-label="Retour"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span
          className={`flex size-10 items-center justify-center rounded-2xl ${couleur.fond} ${couleur.texte}`}
        >
          <Icone nom={rubrique.icone} className="size-5" />
        </span>
        <h1 className="flex-1 text-2xl font-bold tracking-tight">{rubrique.nom}</h1>
        <button
          onClick={() => setFiltresOuverts((v) => !v)}
          aria-label="Filtres et tri"
          className={`relative rounded-full p-2.5 ${
            filtresActifs
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </header>

      <section className="mb-4 grid grid-cols-3 gap-3">
        <Chiffre valeur={String(vus.length)} legende="vus" />
        <Chiffre
          valeur={moyenne != null ? `${moyenne.toFixed(1).replace(".", ",")}★` : "—"}
          legende={`note moy. (${notees.length})`}
        />
        <Chiffre valeur={depense > 0 ? formatEuros(depense) : "—"} legende="dépensé" />
      </section>

      <BarreRecherche
        valeur={recherche}
        onChange={setRecherche}
        placeholder="Titre, lieu, tag, impressions, date…"
      />

      {filtresOuverts && (
        <section className="card-surface mt-3 space-y-4 p-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Statut</p>
            <div className="flex flex-wrap gap-2">
              {STATUTS.map((s) => {
                const actif = statuts.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() =>
                      setStatuts((v) => (actif ? v.filter((x) => x !== s) : [...v, s]))
                    }
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
                      actif
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {LIBELLE_STATUT[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {tagsFrequents.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Tag</p>
              <div className="flex flex-wrap gap-2">
                {tagsFrequents.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTagActif((v) => (v === t ? null : t))}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
                      tagActif === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Tri</p>
            <div className="flex flex-wrap gap-2">
              {TRIS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTri(t)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
                    tri === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {LIBELLE_TRI[t]}
                </button>
              ))}
            </div>
          </div>

          {filtresActifs && (
            <button
              onClick={() => {
                setStatuts([]);
                setTagActif(null);
                setTri("date_desc");
              }}
              className="w-full rounded-xl bg-secondary py-2.5 text-xs font-medium text-muted-foreground"
            >
              Tout réinitialiser
            </button>
          )}
        </section>
      )}

      <p className="mt-4 mb-3 px-1 text-xs text-muted-foreground">
        {visibles.length} fiche{visibles.length > 1 ? "s" : ""}
        {visibles.length !== toutes.length ? ` sur ${toutes.length}` : ""}
      </p>

      <ListeFiches
        fiches={visibles}
        rubriques={rubriques}
        onOuvrir={(f) => {
          setEnEdition(f);
          setFeuilleOuverte(true);
        }}
        onNoter={(f, note) => noter.mutate({ id: f.id, note })}
        onSupprimer={(f) =>
          supprimer.mutate(f.id, {
            onSuccess: () => toast.success(`« ${f.titre} » supprimée`),
            onError: () => toast.error("Suppression impossible."),
          })
        }
        vide={
          toutes.length === 0
            ? "Rubrique vide. Appuyez sur + pour votre première fiche."
            : "Aucune fiche ne correspond."
        }
      />

      <button
        onClick={() => {
          setEnEdition(null);
          setFeuilleOuverte(true);
        }}
        aria-label="Ajouter une fiche"
        className="fixed right-5 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-fab)] active:scale-95"
      >
        <Plus className="size-8" strokeWidth={2.5} />
      </button>

      <FicheSheet
        ouvert={feuilleOuverte}
        fiche={enEdition}
        rubriques={rubriques}
        rubriqueParDefaut={rubrique.id}
        enregistrement={enregistrer.isPending || supprimer.isPending}
        onFermer={() => {
          setFeuilleOuverte(false);
          setEnEdition(null);
        }}
        onEnregistrer={(valeurs) =>
          enregistrer.mutate(enEdition ? { id: enEdition.id, valeurs } : { valeurs }, {
            onSuccess: () => {
              setFeuilleOuverte(false);
              setEnEdition(null);
              toast.success(enEdition ? "Fiche modifiée" : "Fiche ajoutée");
            },
            onError: () => toast.error("Enregistrement impossible. Réessayez."),
          })
        }
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
    <div className="card-surface p-3.5">
      <p className="num text-lg font-bold">{valeur}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{legende}</p>
    </div>
  );
}
