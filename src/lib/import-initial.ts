/**
 * Import des données d'origine (billetterie Quai M + classeurs Le Grand R).
 *
 * L'opération est idempotente : la clé `source` de chaque fiche est unique, donc
 * relancer l'import n'ajoute que ce qui manque et ne touche jamais à ce qui a
 * déjà été corrigé dans l'application. Les rectifications d'une fiche d'origine
 * passent par `CORRECTIONS`, qui ne touchent une fiche que si elle est restée
 * telle que l'import l'avait créée ; il en va de même des `SUPPRESSIONS`, les
 * fiches d'origine retirées de la Boîte noire.
 *
 * Tout se passe côté serveur : les données d'origine ne partent plus dans le
 * code envoyé au navigateur.
 */
import { createServerFn } from "@tanstack/react-start";

import { exigerAcces } from "@/lib/acces";
import { db, instructionInsertion, mettreAJour } from "@/lib/d1.server";
import { FICHES_INITIALES, RUBRIQUES_INITIALES } from "@/data/import-initial";
import { CORRECTIONS, SUPPRESSIONS, type Correction } from "@/data/corrections";

export type ResultatImport = {
  rubriquesCreees: number;
  fichesAjoutees: number;
  fichesIgnorees: number;
  fichesCorrigees: number;
  fichesRetirees: number;
};

// D1 limite le nombre d'instructions par lot ; 100 reste très en dessous.
const PAQUET = 100;

export const NOMBRE_FICHES_INITIALES = FICHES_INITIALES.length;

export const importerDonneesInitiales = createServerFn({ method: "POST" })
  .middleware([exigerAcces])
  .handler(async (): Promise<ResultatImport> => {
    // 1. Les rubriques attendues, créées seulement si elles manquent.
    const { results: existantes } = await db()
      .prepare("SELECT id, slug FROM rubriques")
      .all<{ id: string; slug: string }>();
    const parSlug = new Map(existantes.map((r) => [r.slug, r.id]));
    const manquantes = RUBRIQUES_INITIALES.filter((r) => !parSlug.has(r.slug));

    if (manquantes.length > 0) {
      const instructions = manquantes.map((r) => {
        const id = crypto.randomUUID();
        parSlug.set(r.slug, id);
        return instructionInsertion("rubriques", { ...r }, id);
      });
      await db().batch(instructions);
    }

    // 2. Les fiches déjà importées, repérées par leur clé d'origine.
    const { results: dejaLa } = await db()
      .prepare("SELECT source FROM fiches WHERE source IS NOT NULL")
      .all<{ source: string }>();
    const connues = new Set(dejaLa.map((f) => f.source));
    const aInserer = FICHES_INITIALES.filter((f) => !connues.has(f.source));

    const lignes = aInserer.flatMap((f) => {
      const rubriqueId = parSlug.get(f.rubrique);
      if (!rubriqueId) return [];
      return [
        {
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
          extra: f.extra ?? {},
          source: f.source,
        },
      ];
    });

    for (let i = 0; i < lignes.length; i += PAQUET) {
      await db().batch(lignes.slice(i, i + PAQUET).map((l) => instructionInsertion("fiches", l)));
    }

    return {
      rubriquesCreees: manquantes.length,
      fichesAjoutees: lignes.length,
      fichesIgnorees: FICHES_INITIALES.length - lignes.length,
      fichesCorrigees: await appliquerCorrections(),
      fichesRetirees: await appliquerSuppressions(),
    };
  });

type FicheCorrigeable = {
  id: string;
  source: string | null;
  statut: string;
  date: string | null;
  heure: string | null;
  extra: string;
};

/** Une fiche est corrigeable tant qu'elle a encore toutes les valeurs de `si`. */
function estCorrigeable(f: FicheCorrigeable, c: Correction): boolean {
  const { statut, date, heure } = c.si;
  if (statut !== undefined && f.statut !== statut) return false;
  if (date !== undefined && f.date !== date) return false;
  // Les heures reprises de Postgres sont au format « 19:00:00 ».
  if (heure !== undefined && f.heure?.slice(0, 5) !== heure) return false;
  return true;
}

async function appliquerCorrections(): Promise<number> {
  const sources = CORRECTIONS.map((c) => c.source);
  const { results } = await db()
    .prepare(
      `SELECT id, source, statut, date, heure, extra FROM fiches
       WHERE source IN (${sources.map(() => "?").join(", ")})`,
    )
    .bind(...sources)
    .all<FicheCorrigeable>();

  const parSource = new Map(results.map((f) => [f.source, f]));
  let corrigees = 0;

  for (const c of CORRECTIONS) {
    const fiche = parSource.get(c.source);
    if (!fiche || !estCorrigeable(fiche, c)) continue;

    const extraLu: unknown = JSON.parse(fiche.extra);
    const extraActuel =
      extraLu && typeof extraLu === "object" && !Array.isArray(extraLu)
        ? (extraLu as Record<string, unknown>)
        : {};
    await mettreAJour("fiches", fiche.id, {
      ...c.maj,
      ...(c.extra ? { extra: { ...extraActuel, ...c.extra } } : {}),
    });
    corrigees += 1;
  }

  return corrigees;
}

async function appliquerSuppressions(): Promise<number> {
  let retirees = 0;
  for (const { statut, sources } of SUPPRESSIONS) {
    const { meta } = await db()
      .prepare(
        `DELETE FROM fiches WHERE statut = ? AND source IN (${sources.map(() => "?").join(", ")})`,
      )
      .bind(statut, ...sources)
      .run();
    retirees += meta.changes;
  }
  return retirees;
}
