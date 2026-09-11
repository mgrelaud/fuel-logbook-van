/**
 * Accès aux données de la Boîte noire.
 *
 * Tout passe par ces hooks : aucun composant n'appelle Supabase directement.
 * Les fiches sont chargées d'un bloc (le volume tient largement en mémoire),
 * ce qui rend la recherche et les filtres instantanés et utilisables hors ligne.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COLONNES_FICHE, type Fiche, type Rubrique } from "@/lib/fiches";

export const CLE_RUBRIQUES = ["rubriques"] as const;
export const CLE_FICHES = ["fiches"] as const;

async function idUtilisateur(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Session expirée");
  return data.user.id;
}

export function useRubriques() {
  return useQuery({
    queryKey: CLE_RUBRIQUES,
    queryFn: async (): Promise<Rubrique[]> => {
      const { data, error } = await supabase
        .from("rubriques")
        .select("id,slug,nom,icone,couleur,ordre")
        .order("ordre")
        .order("nom");
      if (error) throw error;
      return (data ?? []) as Rubrique[];
    },
  });
}

export function useFiches() {
  return useQuery({
    queryKey: CLE_FICHES,
    queryFn: async (): Promise<Fiche[]> => {
      const { data, error } = await supabase
        .from("fiches")
        .select(COLONNES_FICHE)
        .order("date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as Fiche[];
    },
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
    mutationFn: async ({ id, valeurs }: { id?: string; valeurs: BrouillonFiche }) => {
      if (id) {
        const { error } = await supabase.from("fiches").update(valeurs).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("fiches")
        .insert({ ...valeurs, user_id: await idUtilisateur() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLE_FICHES }),
  });
}

export function useSupprimerFiche() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fiches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLE_FICHES }),
  });
}

/** Note rapide depuis la liste, sans ouvrir le formulaire. */
export function useNoter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: number | null }) => {
      const { error } = await supabase.from("fiches").update({ note }).eq("id", id);
      if (error) throw error;
    },
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
    mutationFn: async ({ id, valeurs }: { id?: string; valeurs: BrouillonRubrique }) => {
      if (id) {
        const { error } = await supabase.from("rubriques").update(valeurs).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("rubriques")
        .insert({ ...valeurs, user_id: await idUtilisateur() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLE_RUBRIQUES });
      qc.invalidateQueries({ queryKey: CLE_FICHES });
    },
  });
}

export function useSupprimerRubrique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rubriques").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLE_RUBRIQUES });
      qc.invalidateQueries({ queryKey: CLE_FICHES });
    },
  });
}

export { idUtilisateur };
