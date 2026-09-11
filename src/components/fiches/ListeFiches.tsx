import { useState } from "react";

import { LigneGlissable } from "@/components/fiches/LigneGlissable";
import { Note } from "@/components/fiches/Note";
import { Icone } from "@/components/layout/Icone";
import {
  couleurDe,
  formatDateFiche,
  formatEuros,
  grouperParAnnee,
  LIBELLE_STATUT,
  STYLE_STATUT,
  type Fiche,
  type Rubrique,
} from "@/lib/fiches";

export function ListeFiches({
  fiches,
  rubriques,
  montrerRubrique = false,
  onOuvrir,
  onNoter,
  onSupprimer,
  vide,
}: {
  fiches: Fiche[];
  rubriques: Rubrique[];
  montrerRubrique?: boolean;
  onOuvrir: (f: Fiche) => void;
  onNoter: (f: Fiche, note: number | null) => void;
  onSupprimer: (f: Fiche) => void;
  vide: React.ReactNode;
}) {
  // Une seule ligne ouverte à la fois : en ouvrir une referme la précédente.
  const [ligneOuverte, setLigneOuverte] = useState<string | null>(null);

  if (fiches.length === 0) {
    return <div className="card-surface p-6 text-center text-sm text-muted-foreground">{vide}</div>;
  }

  const parId = new Map(rubriques.map((r) => [r.id, r]));

  return (
    <div className="space-y-5">
      {grouperParAnnee(fiches).map(({ annee, fiches: lot }) => (
        <section key={annee}>
          <h3 className="num mb-2 px-1 text-xs font-semibold tracking-widest text-muted-foreground">
            {annee.toUpperCase()} · {lot.length}
          </h3>
          <ul className="space-y-2">
            {lot.map((f) => {
              const rubrique = parId.get(f.rubrique_id);
              const couleur = couleurDe(rubrique?.couleur ?? "orange");
              const avecIcone = montrerRubrique && rubrique !== undefined;

              return (
                <LigneGlissable
                  key={f.id}
                  ouverte={ligneOuverte === f.id}
                  onOuverture={(ouverte) => setLigneOuverte(ouverte ? f.id : null)}
                  onSupprimer={() => {
                    setLigneOuverte(null);
                    onSupprimer(f);
                  }}
                  etiquette={f.titre}
                >
                  {/* La zone d'ouverture et la notation sont deux contrôles
                      voisins : imbriquer des boutons donnerait du HTML invalide
                      et rendrait les étoiles inutilisables. */}
                  <button
                    type="button"
                    onClick={() => onOuvrir(f)}
                    className="flex w-full items-start gap-3 text-left active:opacity-70"
                  >
                    {avecIcone && (
                      <span
                        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${couleur.fond} ${couleur.texte}`}
                      >
                        <Icone nom={rubrique.icone} className="size-4" />
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="min-w-0 flex-1 font-semibold break-words">{f.titre}</span>
                        {f.statut !== "vu" && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STYLE_STATUT[f.statut]}`}
                          >
                            {LIBELLE_STATUT[f.statut]}
                          </span>
                        )}
                      </span>

                      {f.sous_titre && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          + {f.sous_titre}
                        </span>
                      )}

                      <span className="num mt-1 block text-xs text-muted-foreground">
                        {formatDateFiche(f.date, f.heure)}
                        {f.lieu ? ` · ${f.lieu}` : ""}
                        {f.prix != null && Number(f.prix) > 0
                          ? ` · ${formatEuros(Number(f.prix))}`
                          : ""}
                      </span>

                      {f.avis && (
                        <span className="mt-1.5 line-clamp-2 block text-xs text-muted-foreground italic">
                          {f.avis}
                        </span>
                      )}
                    </span>
                  </button>

                  <div
                    className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 ${
                      avecIcone ? "pl-12" : ""
                    }`}
                  >
                    <Note note={f.note} taille="size-4" onChange={(note) => onNoter(f, note)} />
                    {f.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </LigneGlissable>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
