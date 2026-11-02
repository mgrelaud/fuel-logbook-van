/**
 * Accès aux données de la Boîte noire.
 *
 * Tout passe par ces hooks : aucun composant n'appelle le serveur directement
 * (les fonctions serveur sont dans donnees.ts).
 * Les fiches sont chargées d'un bloc (le volume tient largement en mémoire),
 * ce qui rend la recherche et les filtres instantanés et utilisables hors ligne.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  enregistrerFiche,
  enregistrerRubrique,
  listerFiches,
  listerRubriques,
  noterFiche,
  supprimerFiche,
  supprimerRubrique,
} from "@/lib/donnees";
import type { Fiche, Rubrique } from "@/lib/fiches";

export const CLE_RUBRIQUES = ["rubriques"] as const;
export const CLE_FICHES = ["fiches"] as const;

export function useRubriques() {
  return useQuery({
    queryKey: CLE_RUBRIQUES,
    queryFn: (): Promise<Rubrique[]> => listerRubriques(),
  });
}

export function useFiches() {
  return useQuery({
    queryKey: CLE_FICHES,
    queryFn: async (): Promise<Fiche[]> =>
      (await listerFiches()).map((f) => ({ ...f, extra: JSON.parse(f.extra) })),
  });
}

export type BrouillonFiche = {
  rubrique_id: string;
  titre: string;
  sous_titre: string | null;
  date: string | null;
  heure: string | null;
  lieu: string | null;
  ville: string | null;
  statut: Fiche["statut"];
  note: number | null;
  avis: string | null;
  prix: number | null;
  places: number | null;
  tags: string[];
};

export function useEnregistrerFiche() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id?: string; valeurs: BrouillonFiche }) =>
      enregistrerFiche({ data: args }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLE_FICHES }),
  });
}

export function useSupprimerFiche() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerFiche({ data: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLE_FICHES }),
  });
}

/** Note rapide depuis la liste, sans ouvrir le formulaire. */
export function useNoter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; note: number | null }) => noterFiche({ data: args }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLE_FICHES }),
  });
}

export type BrouillonRubrique = {
  slug: string;
  nom: string;
  icone: string;
  couleur: string;
  ordre: number;
};

export function useEnregistrerRubrique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id?: string; valeurs: BrouillonRubrique }) =>
      enregistrerRubrique({ data: args }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLE_RUBRIQUES });
      qc.invalidateQueries({ queryKey: CLE_FICHES });
    },
  });
}

export function useSupprimerRubrique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerRubrique({ data: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLE_RUBRIQUES });
      qc.invalidateQueries({ queryKey: CLE_FICHES });
    },
  });
}
