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
 * Historique de billetterie envoyé par Le Grand R le 22/09/2026 : cinq fiches
 * de 25-26 étaient restées en « envie » ou mal datées dans les classeurs.
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
];
