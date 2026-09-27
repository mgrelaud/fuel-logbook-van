/**
 * Corrections de fiches déjà importées, appliquées à chaque import.
 *
 * L'import n'écrase jamais une fiche existante ; ces corrections sont le seul
 * moyen de rectifier une fiche d'origine après coup. Chacune ne s'applique que
 * si la fiche en base a encore toutes les valeurs de `si` : une fiche modifiée
 * dans l'application entre-temps est laissée telle quelle, et une correction
 * déjà passée ne se rejoue pas.
 *
 * `extra` est fusionné avec l'`extra` existant, le reste remplace la valeur.
 */
import type { StatutFiche } from "@/lib/fiches";

type Champs = {
  statut: StatutFiche;
  date: string;
  heure: string;
  prix: number;
  places: number;
  tags: string[];
};

export type Correction = {
  source: string;
  si: Partial<Pick<Champs, "statut" | "date" | "heure">>;
  maj: Partial<Champs>;
  extra?: Record<string, unknown>;
};

/**
 * - 25-26 : historique de billetterie envoyé par Le Grand R le 22/09/2026 ;
 *   cinq fiches étaient restées en « envie » ou mal datées dans les classeurs.
 * - 26-27 : les dix spectacles réservés (liste donnée le 27/09/2026), avec
 *   le placement. Le tag « réserve » du classeur (liste d'attente) leur est
 *   retiré pour ne pas se confondre avec le statut « réservé ».
 */
export const CORRECTIONS: Correction[] = [
  {
    source: "grandr:2025-2026:ten-thousand-hours",
    si: { statut: "envie", date: "2025-11-06", heure: "19:00" },
    maj: {
      statut: "vu",
      date: "2025-11-07",
      heure: "20:30",
      places: 1,
      tags: ["2025-2026", "Cirque"],
    },
    extra: { placement: "PA H10" },
  },
  {
    source: "grandr:2025-2026:sonia-wieder-atherton",
    si: { statut: "envie" },
    maj: { statut: "vu", prix: 18, places: 1, tags: ["2025-2026", "Musique"] },
    extra: { tarif_unitaire: 18, placement: "131" },
  },
  {
    source: "grandr:2025-2026:velvet",
    si: { statut: "envie", date: "2026-01-27", heure: "20:30" },
    maj: {
      statut: "vu",
      date: "2026-01-28",
      heure: "19:00",
      places: 1,
      tags: ["2025-2026", "Théâtre"],
    },
    extra: { placement: "PA i3" },
  },
  {
    source: "grandr:2025-2026:ka-in",
    si: { date: "2026-02-10", heure: "19:00" },
    maj: { date: "2026-02-11", heure: "20:30" },
  },
  {
    source: "grandr:2025-2026:laurent-bonneau",
    si: { statut: "envie" },
    maj: { statut: "vu", places: 1, tags: ["2025-2026", "Concert littéraire"] },
    extra: { placement: "203" },
  },

  // Saison 26-27 : les places effectivement réservées, avec leur placement.
  {
    source: "grandr:2026-2027:feu",
    si: { statut: "envie" },
    maj: { statut: "reserve", prix: 36.0, places: 2, tags: ["2026-2027", "Danse"] },
    extra: { placement: "E1 / E3" },
  },
  {
    source: "grandr:2026-2027:romeo-et-juliette",
    si: { statut: "envie" },
    maj: { statut: "reserve", prix: 18.0, places: 1, tags: ["2026-2027", "Théâtre"] },
    extra: { placement: "F1" },
  },
  {
    source: "grandr:2026-2027:la-renverse",
    si: { statut: "envie" },
    maj: { statut: "reserve", prix: 36.0, places: 2, tags: ["2026-2027", "Théâtre d'ombres"] },
    extra: { placement: "G2 / G4" },
  },
  {
    source: "grandr:2026-2027:un-spectacle-que-la-loi-considera-mien-swan-lake-solo",
    si: { statut: "envie" },
    maj: { statut: "reserve", prix: 36.0, places: 2, tags: ["2026-2027", "Danse"] },
    extra: { placement: "placement libre" },
  },
  {
    source: "grandr:2026-2027:cantates-3-et-4",
    si: { statut: "envie" },
    maj: { statut: "reserve", prix: 36.0, places: 2, tags: ["2026-2027", "Danse"] },
    extra: { placement: "G7 / G9" },
  },
  {
    source: "grandr:2026-2027:silence",
    si: { statut: "envie" },
    maj: {
      statut: "reserve",
      prix: 36.0,
      places: 2,
      tags: ["2026-2027", "sélection", "Musique • Danse"],
    },
    extra: { placement: "I12 / I14" },
  },
  {
    source: "grandr:2026-2027:les-femmes-savantes",
    si: { statut: "envie" },
    maj: { statut: "reserve", prix: 36.0, places: 2, tags: ["2026-2027", "Théâtre"] },
    extra: { placement: "L2 / L4" },
  },
  {
    source: "grandr:2026-2027:lullaby-shot",
    si: { statut: "envie" },
    maj: { statut: "reserve", prix: 36.0, places: 2, tags: ["2026-2027", "sélection", "Danse"] },
    extra: { placement: "E2 / E4" },
  },
  {
    source: "grandr:2026-2027:amadeus",
    si: { statut: "envie" },
    maj: {
      statut: "reserve",
      prix: 36.0,
      places: 2,
      tags: ["2026-2027", "sélection", "Musique classique"],
    },
    extra: { placement: "D1 / D3" },
  },
  {
    source: "grandr:2026-2027:hyperboles",
    si: { statut: "envie", date: "2027-05-12", heure: "20:30" },
    maj: {
      statut: "reserve",
      prix: 36.0,
      places: 2,
      tags: ["2026-2027", "Cirque • Skateboard"],
      date: "2027-05-13",
      heure: "19:00",
    },
    extra: { placement: "F2 / F4" },
  },
];
