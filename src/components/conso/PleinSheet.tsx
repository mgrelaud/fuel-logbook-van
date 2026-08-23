import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import { litresPer100, nf, parseNumber, type Plein } from "@/lib/conso";

export type PleinInput = { date: string; litres: number; km: number | null; cout: number | null };

export function PleinSheet({
  open,
  initial,
  onClose,
  onSubmit,
  onDelete,
  saving,
}: {
  open: boolean;
  initial: Plein | null;
  onClose: () => void;
  onSubmit: (values: PleinInput) => void;
  onDelete?: (p: Plein) => void;
  saving: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [litres, setLitres] = useState("");
  const [km, setKm] = useState("");
  const [cout, setCout] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmSuppr, setConfirmSuppr] = useState(false);
  const litresRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErreur(null);
    setConfirmSuppr(false);
    setDate(initial?.date ?? today);
    setLitres(initial ? String(initial.litres) : "");
    setKm(initial?.km != null ? String(initial.km) : "");
    setCout(initial?.cout != null ? String(initial.cout) : "");
    const t = setTimeout(() => litresRef.current?.focus(), 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  if (!open) return null;

  const l = parseNumber(litres);
  const k = km.trim() === "" ? null : parseNumber(km);
  const c = cout.trim() === "" ? null : parseNumber(cout);
  const valide = Number.isFinite(l) && l > 0;
  const conso = valide && k !== null && Number.isFinite(k) && k > 0 ? litresPer100(l, k) : null;

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
    if (c !== null && (!Number.isFinite(c) || c < 0)) {
      setErreur("Le coût doit être un montant valide en euros.");
      return;
    }
    setErreur(null);
    onSubmit({ date, litres: l, km: k, cout: c });
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

          <Field label="Km depuis le dernier plein avec distance (optionnel)" suffix="km">
            <input
              value={km}
              onChange={(e) => setKm(e.target.value)}
              inputMode="decimal"
              placeholder="—"
              className="num w-full bg-transparent text-3xl font-semibold outline-none placeholder:text-muted-foreground/40"
            />
          </Field>

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
          {conso ? (
            <>
              <span className="text-sm text-muted-foreground">Consommation de ce plein</span>
              <span className="num text-xl font-bold text-primary">{nf(conso)} L/100 km</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Sans distance : plein intermédiaire, ses litres seront comptés au prochain plein avec
              distance.
            </span>
          )}
        </div>

        {valide && c !== null && Number.isFinite(c) && c > 0 && (
          <div className="mt-2 flex justify-between px-4 text-sm text-muted-foreground">
            <span>{nf(c / l, 3)} €/L</span>
            {conso && k ? <span>{nf((c / k) * 100)} € /100 km</span> : null}
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
  children,
}: {
  label: string;
  suffix?: string;
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
    </label>
  );
}
