import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Download, LogOut, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Icone, NOMS_ICONES } from "@/components/layout/Icone";
import { PorteAuth } from "@/components/layout/PorteAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  useEnregistrerRubrique,
  useFiches,
  useRubriques,
  useSupprimerRubrique,
  CLE_FICHES,
  CLE_RUBRIQUES,
  type BrouillonRubrique,
} from "@/lib/api";
import {
  COULEURS,
  couleurDe,
  fichesEnCsv,
  normaliser,
  telecharger,
  type Rubrique,
} from "@/lib/fiches";
import { importerDonneesInitiales, NOMBRE_FICHES_INITIALES } from "@/lib/import-initial";

export const Route = createFileRoute("/reglages")({
  ssr: false,
  head: () => ({ meta: [{ title: "Réglages — Boîte noire" }] }),
  component: () => (
    <PorteAuth>
      <Reglages />
    </PorteAuth>
  ),
});

const enSlug = (nom: string) => normaliser(nom).replace(/ /g, "-").slice(0, 40) || "rubrique";

function Reglages() {
  const qc = useQueryClient();
  const { data: rubriques = [] } = useRubriques();
  const { data: fiches = [] } = useFiches();
  const enregistrer = useEnregistrerRubrique();
  const supprimer = useSupprimerRubrique();

  const [edition, setEdition] = useState<Rubrique | "nouvelle" | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  const importer = useMutation({
    mutationFn: importerDonneesInitiales,
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: CLE_RUBRIQUES });
      void qc.invalidateQueries({ queryKey: CLE_FICHES });
      toast.success(
        r.fichesAjoutees > 0
          ? `${r.fichesAjoutees} fiche${r.fichesAjoutees > 1 ? "s" : ""} importée${r.fichesAjoutees > 1 ? "s" : ""}.`
          : "Tout était déjà importé.",
      );
    },
    onError: () => toast.error("Import impossible. Réessayez."),
  });

  return (
    <main className="safe-top safe-bottom min-h-screen px-4 pb-16">
      <header className="flex items-center gap-3 py-4">
        <Link
          to="/"
          className="rounded-full bg-secondary p-2.5 text-muted-foreground"
          aria-label="Retour"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="flex-1 text-2xl font-bold tracking-tight">Réglages</h1>
      </header>

      <section className="mt-2">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-sm font-medium text-muted-foreground">Rubriques</h2>
          <button
            onClick={() => setEdition("nouvelle")}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="size-3.5" /> Ajouter
          </button>
        </div>

        {edition === "nouvelle" && (
          <FormulaireRubrique
            rubrique={null}
            ordreSuivant={rubriques.length + 1}
            enCours={enregistrer.isPending}
            onAnnuler={() => setEdition(null)}
            onValider={(valeurs) =>
              enregistrer.mutate(
                { valeurs },
                {
                  onSuccess: () => {
                    setEdition(null);
                    toast.success("Rubrique créée");
                  },
                  onError: () => toast.error("Ce nom est peut-être déjà utilisé."),
                },
              )
            }
          />
        )}

        <ul className="space-y-2">
          {rubriques.map((r) => {
            const couleur = couleurDe(r.couleur);
            const total = fiches.filter((f) => f.rubrique_id === r.id).length;

            if (typeof edition === "object" && edition?.id === r.id) {
              return (
                <li key={r.id}>
                  <FormulaireRubrique
                    rubrique={r}
                    ordreSuivant={r.ordre}
                    enCours={enregistrer.isPending}
                    onAnnuler={() => setEdition(null)}
                    onValider={(valeurs) =>
                      enregistrer.mutate(
                        { id: r.id, valeurs },
                        {
                          onSuccess: () => {
                            setEdition(null);
                            toast.success("Rubrique modifiée");
                          },
                          onError: () => toast.error("Modification impossible."),
                        },
                      )
                    }
                  />
                </li>
              );
            }

            return (
              <li key={r.id} className="card-surface flex items-center gap-3 p-3.5">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${couleur.fond} ${couleur.texte}`}
                >
                  <Icone nom={r.icone} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.nom}</p>
                  <p className="num text-xs text-muted-foreground">
                    {total} fiche{total > 1 ? "s" : ""} · /r/{r.slug}
                  </p>
                </div>
                <button
                  onClick={() => setEdition(r)}
                  aria-label={`Modifier ${r.nom}`}
                  className="rounded-full bg-secondary p-2 text-muted-foreground"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() =>
                    aSupprimer === r.id
                      ? supprimer.mutate(r.id, {
                          onSuccess: () => {
                            setASupprimer(null);
                            toast.success("Rubrique supprimée");
                          },
                          onError: () => toast.error("Suppression impossible."),
                        })
                      : setASupprimer(r.id)
                  }
                  aria-label={`Supprimer ${r.nom}`}
                  className={`rounded-full p-2 ${
                    aSupprimer === r.id
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>

        {aSupprimer && (
          <p className="mt-2 px-1 text-xs text-destructive">
            Appuyez une seconde fois sur la corbeille pour confirmer : les fiches de la rubrique
            seront supprimées avec elle.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 px-1 text-sm font-medium text-muted-foreground">Données</h2>

        <div className="card-surface space-y-3 p-4">
          <div>
            <p className="font-semibold">Import d'origine</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {NOMBRE_FICHES_INITIALES} fiches : billetterie du Quai M (2022 → 2027) et saisons
              24-25, 25-26 et 26-27 du Grand R. Relancer l'import n'ajoute que ce qui manque.
            </p>
          </div>
          <button
            onClick={() => importer.mutate()}
            disabled={importer.isPending}
            className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {importer.isPending ? "Import en cours…" : "Importer mes données d'origine"}
          </button>
        </div>

        <button
          onClick={() =>
            fiches.length
              ? telecharger(
                  `boite-noire-${new Date().toISOString().slice(0, 10)}.csv`,
                  fichesEnCsv(fiches, rubriques),
                  "text/csv",
                )
              : toast.error("Rien à exporter pour l'instant.")
          }
          className="card-surface mt-3 flex w-full items-center gap-3 p-4 text-left"
        >
          <Download className="size-5 text-muted-foreground" />
          <span className="flex-1">
            <span className="block font-semibold">Exporter en CSV</span>
            <span className="num block text-xs text-muted-foreground">
              {fiches.length} fiche{fiches.length > 1 ? "s" : ""}
            </span>
          </span>
        </button>
      </section>

      <section className="mt-8">
        <button
          onClick={() => void supabase.auth.signOut()}
          className="card-surface flex w-full items-center gap-3 p-4 text-left text-destructive"
        >
          <LogOut className="size-5" />
          <span className="font-semibold">Se déconnecter</span>
        </button>
        <p className="mt-4 px-1 text-center text-xs text-muted-foreground">
          Boîte noire — accès réservé à votre compte Apple.
        </p>
      </section>
    </main>
  );
}

function FormulaireRubrique({
  rubrique,
  ordreSuivant,
  enCours,
  onAnnuler,
  onValider,
}: {
  rubrique: Rubrique | null;
  ordreSuivant: number;
  enCours: boolean;
  onAnnuler: () => void;
  onValider: (valeurs: BrouillonRubrique) => void;
}) {
  const [nom, setNom] = useState(rubrique?.nom ?? "");
  const [icone, setIcone] = useState(rubrique?.icone ?? "Sparkles");
  const [couleur, setCouleur] = useState(rubrique?.couleur ?? "orange");

  return (
    <div className="card-surface mb-2 space-y-4 p-4">
      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Nom de la rubrique (Restaurants, Voyages…)"
        className="saisie"
        autoFocus
      />

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Icône</p>
        <div className="grid grid-cols-7 gap-2">
          {NOMS_ICONES.map((nomIcone) => (
            <button
              key={nomIcone}
              type="button"
              onClick={() => setIcone(nomIcone)}
              aria-label={nomIcone}
              className={`flex aspect-square items-center justify-center rounded-xl ${
                icone === nomIcone
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Icone nom={nomIcone} className="size-4" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Couleur</p>
        <div className="flex gap-2">
          {Object.keys(COULEURS).map((nomCouleur) => (
            <button
              key={nomCouleur}
              type="button"
              onClick={() => setCouleur(nomCouleur)}
              aria-label={nomCouleur}
              className={`flex size-9 items-center justify-center rounded-full ${couleurDe(nomCouleur).puce} ${
                couleur === nomCouleur
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                  : ""
              }`}
            >
              {couleur === nomCouleur && <Check className="size-4 text-background" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAnnuler}
          className="flex items-center justify-center rounded-xl bg-secondary px-4 py-3 text-muted-foreground"
          aria-label="Annuler"
        >
          <X className="size-4" />
        </button>
        <button
          onClick={() => {
            if (nom.trim() === "") return;
            onValider({
              slug: rubrique?.slug ?? enSlug(nom),
              nom: nom.trim(),
              icone,
              couleur,
              ordre: ordreSuivant,
            });
          }}
          disabled={enCours || nom.trim() === ""}
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {rubrique ? "Enregistrer" : "Créer la rubrique"}
        </button>
      </div>
    </div>
  );
}
