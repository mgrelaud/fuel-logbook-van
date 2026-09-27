/**
 * Import des données d'origine (billetterie Quai M + classeurs Le Grand R).
 *
 * L'opération est idempotente : la clé `source` de chaque fiche est unique par
 * utilisateur, donc relancer l'import n'ajoute que ce qui manque et ne touche
 * jamais à ce qui a déjà été corrigé dans l'application. Les rectifications
 * d'une fiche d'origine passent par `CORRECTIONS`, qui ne touchent une fiche
 * que si elle est restée telle que l'import l'avait créée.
 */
import { supabase } from "@/integrations/supabase/client";
import { idUtilisateur } from "@/lib/api";
import { FICHES_INITIALES, RUBRIQUES_INITIALES } from "@/data/import-initial";
import { CORRECTIONS, type Correction } from "@/data/corrections";

export type ResultatImport = {
  rubriquesCreees: number;
  fichesAjoutees: number;
  fichesIgnorees: number;
  fichesCorrigees: number;
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
    fichesCorrigees: await appliquerCorrections(),
  };
}

type FicheCorrigeable = {
  id: string;
  source: string | null;
  statut: string;
  date: string | null;
  heure: string | null;
  extra: unknown;
};

/** Une fiche est corrigeable tant qu'elle a encore toutes les valeurs de `si`. */
function estCorrigeable(f: FicheCorrigeable, c: Correction): boolean {
  const { statut, date, heure } = c.si;
  if (statut !== undefined && f.statut !== statut) return false;
  if (date !== undefined && f.date !== date) return false;
  // Postgres rend une colonne `time` sous la forme « 19:00:00 ».
  if (heure !== undefined && f.heure?.slice(0, 5) !== heure) return false;
  return true;
}

async function appliquerCorrections(): Promise<number> {
  const { data, error } = await supabase
    .from("fiches")
    .select("id,source,statut,date,heure,extra")
    .in(
      "source",
      CORRECTIONS.map((c) => c.source),
    );
  if (error) throw error;

  const parSource = new Map((data ?? []).map((f) => [f.source, f as FicheCorrigeable]));
  let corrigees = 0;

  for (const c of CORRECTIONS) {
    const fiche = parSource.get(c.source);
    if (!fiche || !estCorrigeable(fiche, c)) continue;

    const extraActuel =
      fiche.extra && typeof fiche.extra === "object" && !Array.isArray(fiche.extra)
        ? (fiche.extra as Record<string, unknown>)
        : {};
    const { error: erreurMaj } = await supabase
      .from("fiches")
      .update({
        ...c.maj,
        ...(c.extra ? { extra: { ...extraActuel, ...c.extra } as Record<string, never> } : {}),
      })
      .eq("id", fiche.id);
    if (erreurMaj) throw erreurMaj;
    corrigees += 1;
  }

  return corrigees;
}

export const NOMBRE_FICHES_INITIALES = FICHES_INITIALES.length;
