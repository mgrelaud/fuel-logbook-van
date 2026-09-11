/**
 * Modèle de la Boîte noire.
 *
 * Une *rubrique* est une catégorie créée par l'utilisateur (Concerts,
 * Spectacles, et tout ce qu'il ajoutera ensuite) ; une *fiche* est une entrée
 * de son historique dans l'une de ces rubriques. Les champs sont volontairement
 * génériques : ce qui est propre à un domaine va dans `tags` et `extra`, de
 * sorte qu'ajouter une rubrique ne demande jamais de migration.
 */

export const STATUTS = ["vu", "reserve", "envie", "annule"] as const;
export type StatutFiche = (typeof STATUTS)[number];

export const LIBELLE_STATUT: Record<StatutFiche, string> = {
  vu: "Vu",
  reserve: "Réservé",
  envie: "Envie",
  annule: "Annulé",
};

/** Classes Tailwind de la pastille de statut. */
export const STYLE_STATUT: Record<StatutFiche, string> = {
  vu: "bg-success/15 text-success",
  reserve: "bg-primary/15 text-primary",
  envie: "bg-secondary text-muted-foreground",
  annule: "bg-destructive/15 text-destructive",
};

export type Rubrique = {
  id: string;
  slug: string;
  nom: string;
  icone: string;
  couleur: string;
  ordre: number;
};

export type Fiche = {
  id: string;
  rubrique_id: string;
  titre: string;
  sous_titre: string | null;
  date: string | null;
  heure: string | null;
  lieu: string | null;
  ville: string | null;
  statut: StatutFiche;
  note: number | null;
  avis: string | null;
  prix: number | null;
  places: number | null;
  tags: string[];
  extra: Record<string, unknown>;
  source: string | null;
  created_at: string;
  updated_at: string;
};

/** Colonnes demandées à PostgREST — la liste explicite évite les surprises. */
export const COLONNES_FICHE =
  "id,rubrique_id,titre,sous_titre,date,heure,lieu,ville,statut,note,avis,prix,places,tags,extra,source,created_at,updated_at";

/** Couleurs d'accent proposées pour une rubrique. */
export const COULEURS: Record<string, { texte: string; fond: string; puce: string }> = {
  orange: { texte: "text-primary", fond: "bg-primary/12", puce: "bg-primary" },
  violet: {
    texte: "text-[oklch(0.72_0.16_300)]",
    fond: "bg-[oklch(0.72_0.16_300)]/12",
    puce: "bg-[oklch(0.72_0.16_300)]",
  },
  ambre: { texte: "text-warning", fond: "bg-warning/12", puce: "bg-warning" },
  vert: { texte: "text-success", fond: "bg-success/12", puce: "bg-success" },
  bleu: {
    texte: "text-[oklch(0.68_0.14_250)]",
    fond: "bg-[oklch(0.68_0.14_250)]/12",
    puce: "bg-[oklch(0.68_0.14_250)]",
  },
  rose: {
    texte: "text-[oklch(0.72_0.16_350)]",
    fond: "bg-[oklch(0.72_0.16_350)]/12",
    puce: "bg-[oklch(0.72_0.16_350)]",
  },
};

export const couleurDe = (nom: string) => COULEURS[nom] ?? COULEURS["orange"]!;

// ---------------------------------------------------------------- formatage

const fmtJour = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDateFiche(date: string | null, heure: string | null): string {
  if (!date) return "Sans date";
  const jour = fmtJour.format(new Date(`${date}T12:00:00`));
  return heure ? `${jour} · ${heure.slice(0, 5)}` : jour;
}

export const anneeDe = (date: string | null) => (date ? Number(date.slice(0, 4)) : null);

export const formatEuros = (v: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(v) ? 0 : 2,
  }).format(v);

// ---------------------------------------------------------------- recherche

/** Minuscules sans accents ni ponctuation, pour comparer « Yé ! » et « ye ». */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const champsCherchables = (f: Fiche) =>
  [f.titre, f.sous_titre, f.lieu, f.ville, f.avis, ...f.tags].filter(Boolean).join(" ");

/**
 * Recherche tous-mots : chaque mot de la requête doit apparaître quelque part
 * dans la fiche. Le jeu de données tient en mémoire, donc on filtre côté client
 * — la recherche reste instantanée et fonctionne hors ligne.
 */
export function chercher(fiches: Fiche[], requete: string): Fiche[] {
  const mots = normaliser(requete).split(" ").filter(Boolean);
  if (mots.length === 0) return fiches;
  return fiches.filter((f) => {
    const foin = normaliser(champsCherchables(f));
    return mots.every((mot) => foin.includes(mot));
  });
}

// ------------------------------------------------------------------- tri

export type Tri = "date_desc" | "date_asc" | "note_desc" | "titre";

export const LIBELLE_TRI: Record<Tri, string> = {
  date_desc: "Plus récent",
  date_asc: "Plus ancien",
  note_desc: "Mieux noté",
  titre: "A → Z",
};

export function trier(fiches: Fiche[], tri: Tri): Fiche[] {
  const copie = [...fiches];
  switch (tri) {
    case "date_asc":
      return copie.sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
    case "note_desc":
      return copie.sort(
        (a, b) => (b.note ?? -1) - (a.note ?? -1) || (b.date ?? "").localeCompare(a.date ?? ""),
      );
    case "titre":
      return copie.sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
    case "date_desc":
    default:
      return copie.sort((a, b) => (b.date ?? "0000").localeCompare(a.date ?? "0000"));
  }
}

/** Regroupe par année, dans l'ordre où les fiches arrivent. */
export function grouperParAnnee(fiches: Fiche[]): { annee: string; fiches: Fiche[] }[] {
  const groupes: { annee: string; fiches: Fiche[] }[] = [];
  for (const f of fiches) {
    const annee = f.date ? f.date.slice(0, 4) : "Sans date";
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.annee === annee) dernier.fiches.push(f);
    else groupes.push({ annee, fiches: [f] });
  }
  return groupes;
}

// ------------------------------------------------------------------ export

export function fichesEnCsv(fiches: Fiche[], rubriques: Rubrique[]): string {
  const nomRubrique = new Map(rubriques.map((r) => [r.id, r.nom]));
  const entete = [
    "rubrique",
    "titre",
    "sous_titre",
    "date",
    "heure",
    "lieu",
    "ville",
    "statut",
    "note",
    "prix",
    "places",
    "tags",
    "avis",
  ];
  const echappe = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lignes = fiches.map((f) =>
    [
      nomRubrique.get(f.rubrique_id) ?? "",
      f.titre,
      f.sous_titre,
      f.date,
      f.heure,
      f.lieu,
      f.ville,
      LIBELLE_STATUT[f.statut],
      f.note,
      f.prix,
      f.places,
      f.tags.join(" · "),
      f.avis,
    ]
      .map(echappe)
      .join(";"),
  );
  return [entete.join(";"), ...lignes].join("\n");
}

export function telecharger(nom: string, contenu: string, type: string) {
  const blob = new Blob(["﻿" + contenu], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
}
