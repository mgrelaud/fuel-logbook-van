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

/**
 * Fiches d'origine retirées de la Boîte noire, qui ne garde que ce qui a été
 * vu ou réservé (décision du 27/09/2026) : les envies des classeurs du Grand R
 * (25-26 et 26-27) et le concert annulé du Quai M.
 *
 * Comme une correction, une suppression ne vaut que si la fiche a encore son
 * statut d'origine : une envie passée entre-temps en « réservé » ou « vu » dans
 * l'application est conservée.
 */
export const SUPPRESSIONS: { statut: StatutFiche; sources: string[] }[] = [
  {
    statut: "envie",
    sources: [
      "grandr:2025-2026:clan-cabane",
      "grandr:2025-2026:rentrez",
      "grandr:2025-2026:marie-darrieussecq",
      "grandr:2025-2026:sur-les-pas-d-oodaaq",
      "grandr:2025-2026:mathieu-au-milieu",
      "grandr:2025-2026:cache-toi-arsene",
      "grandr:2025-2026:l-amie",
      "grandr:2025-2026:les-banquets-litteraires",
      "grandr:2025-2026:arome-arome",
      "grandr:2025-2026:une-maison-de-poupee",
      "grandr:2025-2026:marius",
      "grandr:2025-2026:nocturne-parade",
      "grandr:2025-2026:emily-loizeau",
      "grandr:2025-2026:enso",
      "grandr:2025-2026:fauxfaire-fauxvoir",
      "grandr:2025-2026:il-ne-m-est-jamais-rien-arrive",
      "grandr:2025-2026:beata-umubyeyi-mairesse",
      "grandr:2025-2026:ailleurs",
      "grandr:2025-2026:ingrid-thobois",
      "grandr:2025-2026:valentina",
      "grandr:2025-2026:la-petite-soldate",
      "grandr:2025-2026:le-printemps-des-poetes",
      "grandr:2025-2026:anitya",
      "grandr:2025-2026:fusees",
      "grandr:2025-2026:la-guerre-n-a-pas-un-visage-de-femme",
      "grandr:2025-2026:adrien-girault",
      "grandr:2025-2026:dafne-kritharas",
      "grandr:2025-2026:la-saga-de-moliere",
      "grandr:2025-2026:jacques-gamblin",
      "grandr:2025-2026:coquilles",
      "grandr:2025-2026:ma-mere-c-est-pas-un-ange",
      "grandr:2025-2026:ballake-sissoko-piers-faccini",
      "grandr:2026-2027:au-crepuscule",
      "grandr:2026-2027:deviation-perec",
      "grandr:2026-2027:rentrez",
      "grandr:2026-2027:ce-que-le-ventre-dit",
      "grandr:2026-2027:fugaces",
      "grandr:2026-2027:orchestre-national-des-pays-de-la-loire",
      "grandr:2026-2027:song-for-abbey",
      "grandr:2026-2027:pani",
      "grandr:2026-2027:ricochet",
      "grandr:2026-2027:la-petite-aux-allumettes",
      "grandr:2026-2027:bientot-le-jour",
      "grandr:2026-2027:laurent-mauvignier",
      "grandr:2026-2027:line",
      "grandr:2026-2027:comment-nicole-a-tout-pete",
      "grandr:2026-2027:deux-pierres",
      "grandr:2026-2027:globule",
      "grandr:2026-2027:l-ours",
      "grandr:2026-2027:rebecca-dautremer",
      "grandr:2026-2027:en-sicile",
      "grandr:2026-2027:banquet-litteraire",
      "grandr:2026-2027:cendrillon",
      "grandr:2026-2027:yongoyely",
      "grandr:2026-2027:miossec",
      "grandr:2026-2027:7-minutes",
      "grandr:2026-2027:estelle-sarah-bulle",
      "grandr:2026-2027:immaqaa-ici-peut-etre",
      "grandr:2026-2027:hernani",
      "grandr:2026-2027:des-oracles",
      "grandr:2026-2027:here-and-now",
      "grandr:2026-2027:l-affaire-l-ex-re",
      "grandr:2026-2027:vaslav",
      "grandr:2026-2027:la-loi-du-marche",
      "grandr:2026-2027:coline-pierre",
      "grandr:2026-2027:vanessa-wagner",
      "grandr:2026-2027:conseils-aux-spectateurs",
      "grandr:2026-2027:la-distance",
      "grandr:2026-2027:celestin-de-meeus",
      "grandr:2026-2027:sibylline",
      "grandr:2026-2027:barbara-par-barbara",
      "grandr:2026-2027:les-regles-zombies-la-dicterie",
      "grandr:2026-2027:thaumazein",
      "grandr:2026-2027:immobile-et-rebondi-2",
      "grandr:2026-2027:400-grammes-pour-un-repas-partage",
      "grandr:2026-2027:lucie-taieb",
      "grandr:2026-2027:courir-le-risque",
      "grandr:2026-2027:george-sans-s",
      "grandr:2026-2027:elene-usdin",
      "grandr:2026-2027:souimanga-celle-qui-danse",
    ],
  },
  { statut: "annule", sources: ["quaim:2024-02-03:charlotte-cardin-mega"] },
];
