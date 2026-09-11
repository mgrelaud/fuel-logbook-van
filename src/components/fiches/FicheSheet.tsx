import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";

import { Note } from "@/components/fiches/Note";
import type { BrouillonFiche } from "@/lib/api";
import { LIBELLE_STATUT, STATUTS, type Fiche, type Rubrique, type StatutFiche } from "@/lib/fiches";

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/** Formulaire de création / modification d'une fiche, en feuille du bas. */
export function FicheSheet({
  ouvert,
  fiche,
  rubriques,
  rubriqueParDefaut,
  enregistrement,
  onFermer,
  onEnregistrer,
  onSupprimer,
}: {
  ouvert: boolean;
  fiche: Fiche | null;
  rubriques: Rubrique[];
  rubriqueParDefaut: string | null;
  enregistrement: boolean;
  onFermer: () => void;
  onEnregistrer: (valeurs: BrouillonFiche) => void;
  onSupprimer?: (fiche: Fiche) => void;
}) {
  const [rubriqueId, setRubriqueId] = useState("");
  const [titre, setTitre] = useState("");
  const [sousTitre, setSousTitre] = useState("");
  const [date, setDate] = useState(aujourdhui());
  const [heure, setHeure] = useState("");
  const [lieu, setLieu] = useState("");
  const [ville, setVille] = useState("");
  const [statut, setStatut] = useState<StatutFiche>("vu");
  const [note, setNote] = useState<number | null>(null);
  const [avis, setAvis] = useState("");
  const [prix, setPrix] = useState("");
  const [places, setPlaces] = useState("");
  const [tags, setTags] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);
  const titreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    setErreur(null);
    setConfirmeSuppression(false);
    setRubriqueId(fiche?.rubrique_id ?? rubriqueParDefaut ?? rubriques[0]?.id ?? "");
    setTitre(fiche?.titre ?? "");
    setSousTitre(fiche?.sous_titre ?? "");
    setDate(fiche?.date ?? aujourdhui());
    setHeure(fiche?.heure?.slice(0, 5) ?? "");
    setLieu(fiche?.lieu ?? "");
    setVille(fiche?.ville ?? "");
    setStatut(fiche?.statut ?? "vu");
    setNote(fiche?.note ?? null);
    setAvis(fiche?.avis ?? "");
    setPrix(fiche?.prix != null ? String(fiche.prix) : "");
    setPlaces(fiche?.places != null ? String(fiche.places) : "");
    setTags(fiche?.tags.join(", ") ?? "");
    const t = setTimeout(() => titreRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [ouvert, fiche, rubriqueParDefaut, rubriques]);

  if (!ouvert) return null;

  function nombreOuNull(valeur: string): number | null {
    const brut = valeur.replace(",", ".").trim();
    if (brut === "") return null;
    const n = Number(brut);
    return Number.isFinite(n) ? n : Number.NaN;
  }

  function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!rubriqueId) {
      setErreur("Choisissez une rubrique.");
      return;
    }
    if (titre.trim() === "") {
      setErreur("Le titre est obligatoire.");
      return;
    }
    const p = nombreOuNull(prix);
    if (p !== null && (Number.isNaN(p) || p < 0)) {
      setErreur("Le prix doit être un montant valide en euros, ou laissé vide.");
      return;
    }
    const pl = nombreOuNull(places);
    if (pl !== null && (Number.isNaN(pl) || pl < 1)) {
      setErreur("Le nombre de places doit être au moins 1, ou laissé vide.");
      return;
    }
    setErreur(null);
    onEnregistrer({
      rubrique_id: rubriqueId,
      titre: titre.trim(),
      sous_titre: sousTitre.trim() || null,
      date: date || null,
      heure: heure || null,
      lieu: lieu.trim() || null,
      ville: ville.trim() || null,
      statut,
      note,
      avis: avis.trim() || null,
      prix: p,
      places: pl,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onFermer}
      />
      <form
        onSubmit={envoyer}
        className="animate-in slide-in-from-bottom-8 safe-bottom relative max-h-[92vh] overflow-y-auto rounded-t-[2rem] border-t border-border bg-card px-5 pt-4 duration-200"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {fiche ? "Modifier la fiche" : "Nouvelle fiche"}
          </h2>
          <button
            type="button"
            onClick={onFermer}
            className="rounded-full bg-secondary p-2 text-muted-foreground"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 pb-5">
          <Champ label="Rubrique">
            <select
              value={rubriqueId}
              onChange={(e) => setRubriqueId(e.target.value)}
              className="saisie"
            >
              {rubriques.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
          </Champ>

          <Champ label="Titre">
            <input
              ref={titreRef}
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Nom du concert, du spectacle…"
              className="saisie"
              autoCapitalize="sentences"
            />
          </Champ>

          <Champ label="Sous-titre" aide="Première partie, compagnie, salle…">
            <input
              value={sousTitre}
              onChange={(e) => setSousTitre(e.target.value)}
              className="saisie"
            />
          </Champ>

          <div className="grid grid-cols-2 gap-3">
            <Champ label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="saisie"
              />
            </Champ>
            <Champ label="Heure">
              <input
                type="time"
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
                className="saisie"
              />
            </Champ>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Champ label="Lieu">
              <input value={lieu} onChange={(e) => setLieu(e.target.value)} className="saisie" />
            </Champ>
            <Champ label="Ville">
              <input value={ville} onChange={(e) => setVille(e.target.value)} className="saisie" />
            </Champ>
          </div>

          <Champ label="Statut">
            <div className="grid grid-cols-4 gap-2">
              {STATUTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatut(s)}
                  className={`rounded-xl py-2.5 text-xs font-medium transition-colors ${
                    statut === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {LIBELLE_STATUT[s]}
                </button>
              ))}
            </div>
          </Champ>

          <Champ label="Note">
            <div className="flex items-center gap-3 py-1">
              <Note note={note} onChange={setNote} taille="size-7" />
              {note != null && (
                <button
                  type="button"
                  onClick={() => setNote(null)}
                  className="text-xs text-muted-foreground underline"
                >
                  effacer
                </button>
              )}
            </div>
          </Champ>

          <Champ label="Impressions">
            <textarea
              value={avis}
              onChange={(e) => setAvis(e.target.value)}
              rows={3}
              placeholder="Ce qu'il faut en retenir…"
              className="saisie resize-none"
            />
          </Champ>

          <div className="grid grid-cols-2 gap-3">
            <Champ label="Prix total (€)">
              <input
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                inputMode="decimal"
                className="saisie num"
              />
            </Champ>
            <Champ label="Places">
              <input
                value={places}
                onChange={(e) => setPlaces(e.target.value)}
                inputMode="numeric"
                className="saisie num"
              />
            </Champ>
          </div>

          <Champ label="Tags" aide="Séparés par des virgules">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Quai M, jazz, avec Yael"
              className="saisie"
            />
          </Champ>

          {erreur && (
            <p className="rounded-xl bg-destructive/15 px-4 py-3 text-sm text-destructive">
              {erreur}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {fiche && onSupprimer && (
              <button
                type="button"
                onClick={() => {
                  if (confirmeSuppression) onSupprimer(fiche);
                  else setConfirmeSuppression(true);
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-destructive/15 px-4 py-4 text-sm font-semibold text-destructive"
              >
                <Trash2 className="size-4" />
                {confirmeSuppression ? "Confirmer" : ""}
              </button>
            )}
            <button
              type="submit"
              disabled={enregistrement}
              className="flex-1 rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground disabled:opacity-60"
            >
              {enregistrement ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Champ({
  label,
  aide,
  children,
}: {
  label: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2 text-xs font-medium text-muted-foreground">
        {label}
        {aide && <span className="text-[11px] font-normal opacity-70">{aide}</span>}
      </span>
      {children}
    </label>
  );
}
