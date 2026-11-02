/**
 * Accès à la base D1 (SQLite) de la Boîte noire, côté serveur uniquement.
 *
 * Une seule personne, derrière Cloudflare Access : plus de colonne user_id ni de
 * RLS. Les tableaux et objets (tags, extra) sont stockés en JSON texte et relus
 * ici, pour que le reste de l'application garde les types d'avant.
 */
import { env } from "cloudflare:workers";

import type { Fiche, Rubrique } from "@/lib/fiches";
import type { Plein } from "@/lib/conso";

export const COLONNES_ECRITURE = {
  fiches: [
    "rubrique_id",
    "titre",
    "sous_titre",
    "date",
    "heure",
    "lieu",
    "ville",
    "statut",
    "note",
    "avis",
    "prix",
    "places",
    "tags",
    "extra",
    "source",
  ],
  rubriques: ["slug", "nom", "icone", "couleur", "ordre"],
  pleins: ["date", "litres", "km", "compteur", "cout"],
} as const;

export type Table = keyof typeof COLONNES_ECRITURE;

const db = () => env.DB;
const maintenant = () => new Date().toISOString();

/** Valeur prête pour D1 : tableaux et objets en JSON, undefined en NULL. */
function versSql(valeur: unknown): unknown {
  if (valeur === undefined) return null;
  if (valeur !== null && typeof valeur === "object") return JSON.stringify(valeur);
  return valeur;
}

/** Ne garde que les colonnes autorisées : rien d'autre n'atteint le SQL. */
function filtrer(table: Table, valeurs: Record<string, unknown>) {
  const autorisees = COLONNES_ECRITURE[table] as readonly string[];
  return Object.entries(valeurs).filter(([cle]) => autorisees.includes(cle));
}

export function instructionInsertion(
  table: Table,
  valeurs: Record<string, unknown>,
  id = crypto.randomUUID(),
) {
  const champs = filtrer(table, valeurs);
  const colonnes = ["id", ...champs.map(([c]) => c)];
  return db()
    .prepare(
      `INSERT INTO ${table} (${colonnes.join(", ")}) VALUES (${colonnes.map(() => "?").join(", ")})`,
    )
    .bind(id, ...champs.map(([, v]) => versSql(v)));
}

export function instructionMiseAJour(table: Table, id: string, valeurs: Record<string, unknown>) {
  const champs = filtrer(table, valeurs);
  if (table === "fiches") champs.push(["updated_at", maintenant()]);
  return db()
    .prepare(`UPDATE ${table} SET ${champs.map(([c]) => `${c} = ?`).join(", ")} WHERE id = ?`)
    .bind(...champs.map(([, v]) => versSql(v)), id);
}

export async function inserer(table: Table, valeurs: Record<string, unknown>) {
  await instructionInsertion(table, valeurs).run();
}

export async function mettreAJour(table: Table, id: string, valeurs: Record<string, unknown>) {
  if (filtrer(table, valeurs).length === 0) return;
  await instructionMiseAJour(table, id, valeurs).run();
}

export async function supprimer(table: Table, id: string) {
  await db().prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
}

export async function lireRubriques(): Promise<Rubrique[]> {
  const { results } = await db()
    .prepare("SELECT id, slug, nom, icone, couleur, ordre FROM rubriques ORDER BY ordre, nom")
    .all<Rubrique>();
  return results;
}

type LigneFiche = Omit<Fiche, "tags" | "extra"> & { tags: string; extra: string };

/**
 * Fiche telle qu'elle voyage vers le navigateur : `extra` reste en JSON texte,
 * un objet libre n'étant pas sérialisable aux yeux des types de TanStack Start.
 * C'est api.ts qui le relit.
 */
export type FicheTransport = Omit<Fiche, "extra"> & { extra: string };

export async function lireFiches(): Promise<FicheTransport[]> {
  // « nullsFirst: false » de PostgREST : les fiches sans date à la fin.
  const { results } = await db()
    .prepare(
      `SELECT id, rubrique_id, titre, sous_titre, date, heure, lieu, ville, statut, note, avis,
              prix, places, tags, extra, source, created_at, updated_at
       FROM fiches ORDER BY date IS NULL, date DESC`,
    )
    .all<LigneFiche>();
  return results.map((f) => ({ ...f, tags: JSON.parse(f.tags) as string[] }));
}

export async function lirePleins(): Promise<Plein[]> {
  const { results } = await db()
    .prepare(
      "SELECT id, date, litres, km, compteur, cout, created_at FROM pleins ORDER BY date DESC, created_at DESC",
    )
    .all<Plein>();
  return results;
}

export { db };
