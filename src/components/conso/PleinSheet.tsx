import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import { blocDe, formatDate, nf, nf0, parseNumber, relevesAutour, type Plein } from "@/lib/conso";

export type PleinInput = {
  date: string;
  litres: number;
  km: number | null;
  compteur: number | null;
  cout: number | null;
};

export function PleinSheet({
  open,
  initial,
  pleins,
  onClose,
  onSubmit,
  onDelete,
  saving,
}: {
  open: boolean;
  initial: Plein | null;
  pleins: Plein[];
  onClose: () => void;
  onSubmit: (values: PleinInput) => void;
  onDelete?: (p: Plein) => void;
  saving: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [litres, setLitres] = useState("");
  const [km, setKm] = useState("");
  const [compteur, setCompteur] = useState("");
  const [cout, setCout] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmSuppr, setConfirmSuppr] = useState(false);
  const litresRef = useRef<HTMLInputElement>(null);
  // Horodatage d'un plein en cours de création : il se range après ceux du même jour.
  const creeLe = useRef(new Date().toISOString());

  useEffect(() => {
    if (!open) return;
    setErreur(null);
    setConfirmSuppr(false);
    setDate(initial?.date ?? today);
    setLitres(initial ? String(initial.litres) : "");
    setKm(initial?.km != null ? String(initial.km) : "");
    setCompteur(initial?.compteur != null ? String(initial.compteur) : "");
    creeLe.current = new Date().toISOString();
    setCout(initial?.cout != null ? String(initial.cout) : "");
    const t = setTimeout(() => litresRef.current?.focus(), 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  if (!open) return null;

  // Un plein saisi avant le compteur garde sa distance partielle, modifiable.
  const ancien = initial != null && initial.compteur == null && initial.km != null;

  const l = parseNumber(litres);
  const k = ancien && km.trim() !== "" ? parseNumber(km) : null;
  const r = compteur.trim() === "" ? null : parseNumber(compteur.replace(/\s/g, ""));
  const c = cout.trim() === "" ? null : parseNumber(cout);
  const valide = Number.isFinite(l) && l > 0;

  const candidat: Plein = {
    id: initial?.id ?? "nouveau",
    date,
    litres: valide ? l : 0,
    km: k !== null && Number.isFinite(k) ? k : null,
    compteur: r !== null && Number.isFinite(r) ? r : null,
    cout: c,
    created_at: initial?.created_at ?? creeLe.current,
  };
  const { avant, apres } = relevesAutour(pleins, candidat);
  const releveAvant = avant?.compteur != null ? Number(avant.compteur) : null;
  const releveApres = apres?.compteur != null ? Number(apres.compteur) : null;
  const bloc = valide ? blocDe(pleins, candidat) : undefined;
  const conso = bloc?.cloture ? bloc.conso : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(l) || l <= 0) {
      setErreur("Indiquez un nombre de litres supérieur à 0.");
      return;
    }
    if (k !== null && (!Number.isFinite(k) || k <= 0)) {
      setErreur("La distance doit être supérieure à 0, ou laissée vide.");
      return;
    }
    if (r !== null && (!Number.isFinite(r) || r < 0)) {
      setErreur("Le compteur doit être un nombre de kilomètres, ou laissé vide.");
      return;
    }
    if (r !== null && releveAvant !== null && r <= releveAvant) {
      setErreur(
        `Le compteur doit dépasser le relevé précédent (${nf0(releveAvant)} km le ${formatDate(avant!.date)}).`,
      );
      return;
    }
    if (r !== null && releveApres !== null && r >= releveApres) {
      setErreur(
        `Le compteur doit rester sous le relevé suivant (${nf0(releveApres)} km le ${formatDate(apres!.date)}).`,
      );
      return;
    }
    if (c !== null && (!Number.isFinite(c) || c < 0)) {
      setErreur("Le coût doit être un montant valide en euros.");
      return;
    }
    setErreur(null);
    onSubmit({ date, litres: l, km: k, compteur: r, cout: c });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className="animate-in slide-in-from-bottom-8 safe-bottom relative rounded-t-[2rem] border-t border-border bg-card px-5 pt-4 duration-200"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {initial ? "Modifier le plein" : "Nouveau plein"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-secondary p-2 text-muted-foreground"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Litres" suffix="L">
            <input
              ref={litresRef}
              value={litres}
              onChange={(e) => setLitres(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="num w-full bg-transparent text-3xl font-semibold outline-none placeholder:text-muted-foreground/40"
            />
          </Field>

          <Field
            label="Compteur kilométrique (si plein complet)"
            suffix="km"
            aide={
              releveAvant !== null
                ? `Dernier relevé : ${nf0(releveAvant)} km le ${formatDate(avant!.date)}`
                : "Premier relevé : il servira de point de départ."
            }
          >
            <input
              value={compteur}
              onChange={(e) => setCompteur(e.target.value)}
              inputMode="numeric"
              placeholder={releveAvant !== null ? nf0(releveAvant) : "—"}
              className="num w-full bg-transparent text-3xl font-semibold outline-none placeholder:text-muted-foreground/40"
            />
          </Field>

          {ancien && (
            <Field label="Distance partielle (ancienne saisie)" suffix="km">
              <input
                value={km}
                onChange={(e) => setKm(e.target.value)}
                inputMode="decimal"
                placeholder="—"
                className="num w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground/40"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Coût (optionnel)" suffix="€">
              <input
                value={cout}
                onChange={(e) => setCout(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className="num w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground/40"
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="num w-full bg-transparent text-lg font-medium outline-none"
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex min-h-[3.25rem] items-center justify-between rounded-2xl bg-secondary px-4 py-3">
          {conso != null && bloc?.km != null ? (
            <>
              <span className="text-sm text-muted-foreground">
                {nf0(bloc.km)} km
                {bloc.pleins.length > 1 ? ` · ${bloc.pleins.length} pleins` : ""}
              </span>
              <span className="num text-xl font-bold text-primary">{nf(conso)} L/100 km</span>
            </>
          ) : bloc?.depart ? (
            <span className="text-sm text-muted-foreground">
              Point de départ du compteur : la consommation se calculera au prochain relevé.
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Sans relevé : plein partiel, ses litres compteront au prochain plein avec relevé.
            </span>
          )}
        </div>

        {valide && c !== null && Number.isFinite(c) && c > 0 && (
          <div className="mt-2 flex justify-between px-4 text-sm text-muted-foreground">
            <span>{nf(c / l, 3)} €/L</span>
            {conso != null && bloc?.km ? (
              <span>{nf((bloc.cout / bloc.km) * 100)} € /100 km</span>
            ) : null}
          </div>
        )}

        {erreur && (
          <p className="mt-3 rounded-xl bg-destructive/15 px-4 py-2 text-sm text-destructive">
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : initial ? "Enregistrer" : "Ajouter le plein"}
        </button>

        {initial && onDelete && (
          <div className="mt-2 mb-4">
            {confirmSuppr ? (
              <div className="rounded-2xl bg-destructive/10 p-3">
                <p className="mb-2 text-center text-sm text-destructive">
                  Supprimer définitivement ce plein ?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmSuppr(false)}
                    className="flex-1 rounded-xl bg-secondary py-3 text-sm font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(initial)}
                    className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSuppr(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium text-destructive"
              >
                <Trash2 className="size-4" /> Supprimer ce plein
              </button>
            )}
          </div>
        )}
        {(!initial || !onDelete) && <div className="mb-4" />}
      </form>
    </div>
  );
}

function Field({
  label,
  suffix,
  aide,
  children,
}: {
  label: string;
  suffix?: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-2xl bg-secondary px-4 py-3">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="mt-1 flex items-baseline gap-2">
        {children}
        {suffix && <span className="text-base text-muted-foreground">{suffix}</span>}
      </div>
      {aide && <p className="num mt-1 text-xs text-muted-foreground">{aide}</p>}
    </label>
  );
}
