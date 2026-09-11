/**
 * Import des données d'origine (billetterie Quai M + classeurs Le Grand R).
 *
 * L'opération est idempotente : la clé `source` de chaque fiche est unique par
 * utilisateur, donc relancer l'import n'ajoute que ce qui manque et ne touche
 * jamais à ce qui a déjà été corrigé dans l'application.
 */
import { supabase } from "@/integrations/supabase/client";
import { idUtilisateur } from "@/lib/api";
import { FICHES_INITIALES, RUBRIQUES_INITIALES } from "@/data/import-initial";

export type ResultatImport = {
  rubriquesCreees: number;
  fichesAjoutees: number;
  fichesIgnorees: number;
};

const PAQUET = 100;

export async function importerDonneesInitiales(): Promise<ResultatImport> {
  const userId = await idUtilisateur();

  // 1. Les rubriques attendues, créées seulement si elles manquent.
  const { data: existantes, error: erreurLecture } = await supabase
    .from("rubriques")
    .select("id,slug");
  if (erreurLecture) throw erreurLecture;

  const parSlug = new Map((existantes ?? []).map((r) => [r.slug, r.id]));
  const manquantes = RUBRIQUES_INITIALES.filter((r) => !parSlug.has(r.slug));

  if (manquantes.length > 0) {
    const { data: creees, error } = await supabase
      .from("rubriques")
      .insert(manquantes.map((r) => ({ ...r, user_id: userId })))
      .select("id,slug");
    if (error) throw error;
    for (const r of creees ?? []) parSlug.set(r.slug, r.id);
  }

  // 2. Les fiches déjà importées, repérées par leur clé d'origine.
  const { data: dejaLa, error: erreurSources } = await supabase
    .from("fiches")
    .select("source")
    .not("source", "is", null);
  if (erreurSources) throw erreurSources;

  const connues = new Set((dejaLa ?? []).map((f) => f.source));
  const aInserer = FICHES_INITIALES.filter((f) => !connues.has(f.source));

  const lignes = aInserer.flatMap((f) => {
    const rubriqueId = parSlug.get(f.rubrique);
    if (!rubriqueId) return [];
    return [
      {
        user_id: userId,
        rubrique_id: rubriqueId,
        titre: f.titre,
        sous_titre: f.sous_titre ?? null,
        date: f.date ?? null,
        heure: f.heure ?? null,
        lieu: f.lieu ?? null,
        ville: f.ville ?? null,
        statut: f.statut,
        avis: f.avis ?? null,
        prix: f.prix ?? null,
        places: f.places ?? null,
        tags: f.tags ?? [],
        extra: (f.extra ?? {}) as Record<string, never>,
        source: f.source,
      },
    ];
  });

  for (let i = 0; i < lignes.length; i += PAQUET) {
    const { error } = await supabase.from("fiches").insert(lignes.slice(i, i + PAQUET));
    if (error) throw error;
  }

  return {
    rubriquesCreees: manquantes.length,
    fichesAjoutees: lignes.length,
    fichesIgnorees: FICHES_INITIALES.length - lignes.length,
  };
}

export const NOMBRE_FICHES_INITIALES = FICHES_INITIALES.length;
