import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { computeBlocs, formatDate, nf, nf0, type Plein } from "@/lib/conso";

export function Historique({
  pleins,
  onEdit,
  onDelete,
}: {
  pleins: Plein[];
  onEdit: (p: Plein) => void;
  onDelete: (p: Plein) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const startX = useRef(0);

  if (pleins.length === 0) {
    return (
      <div className="card-surface p-6 text-center text-sm text-muted-foreground">
        Aucun plein pour l'instant. Appuyez sur + pour en ajouter un.
      </div>
    );
  }

  const blocs = [...computeBlocs(pleins)].reverse();

  return (
    <div className="space-y-3">
      {blocs.map((bloc, i) => {
        const lignes = [...bloc.pleins].reverse();
        const multi = bloc.pleins.length > 1;
        return (
          <div
            key={bloc.pleins[0]?.id ?? i}
            className={`card-surface overflow-hidden ${
              bloc.cloture ? "border-l-4 border-l-primary/60" : "border-l-4 border-l-muted"
            }`}
          >
            {multi && (
              <div className="flex items-center justify-between bg-secondary/50 px-4 py-1.5 text-[11px] text-muted-foreground">
                <span>
                  Bloc de {bloc.pleins.length} pleins · {nf(bloc.litres, 1)} L
                  {bloc.km != null ? ` · ${nf0(bloc.km)} km` : ""}
                </span>
                <span>{bloc.cloture ? `${nf(bloc.conso ?? 0)} L/100` : "en attente"}</span>
              </div>
            )}

            <ul className="divide-y divide-border">
              {lignes.map((p) => {
                const cloture = p.km != null && Number(p.km) > 0;
                const open = openId === p.id;
                return (
                  <li key={p.id} className="relative">
                    <button
                      type="button"
                      onClick={() => (open ? setOpenId(null) : onEdit(p))}
                      onTouchStart={(e) => {
                        startX.current = e.touches[0]?.clientX ?? 0;
                      }}
                      onTouchMove={(e) => {
                        const dx = (e.touches[0]?.clientX ?? 0) - startX.current;
                        if (dx < -40) setOpenId(p.id);
                        if (dx > 40) setOpenId(null);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{formatDate(p.date)}</p>
                        <p className="num mt-0.5 text-xs text-muted-foreground">
                          {nf(Number(p.litres), 1)} L
                          {cloture ? ` · ${nf0(Number(p.km))} km` : ""}
                          {p.cout != null ? ` · ${nf(Number(p.cout))} €` : ""}
                        </p>
                      </div>
                      {cloture && bloc.conso != null ? (
                        <>
                          <span className="num text-lg font-bold text-primary">
                            {nf(bloc.conso)}
                          </span>
                          <span className="text-xs text-muted-foreground">L/100</span>
                        </>
                      ) : (
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
                          intermédiaire
                        </span>
                      )}
                    </button>

                    {open && (
                      <div className="flex gap-2 border-t border-border bg-secondary/60 px-4 py-2">
                        <button
                          onClick={() => setOpenId(null)}
                          className="flex-1 rounded-xl bg-secondary py-2 text-sm font-medium"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => {
                            setOpenId(null);
                            onDelete(p);
                          }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive/15 py-2 text-sm font-medium text-destructive"
                        >
                          <Trash2 className="size-4" /> Supprimer
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
