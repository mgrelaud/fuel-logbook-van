import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatDate, litresPer100, nf, nf0, type Plein } from "@/lib/conso";

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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startX = useRef(0);

  if (pleins.length === 0) {
    return (
      <div className="card-surface p-6 text-center text-sm text-muted-foreground">
        Aucun plein pour l'instant. Appuyez sur + pour en ajouter un.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {pleins.map((p) => {
        const conso = litresPer100(Number(p.litres), Number(p.km));
        const open = openId === p.id;
        return (
          <li
            key={p.id}
            className="card-surface overflow-hidden"
            onContextMenu={(e) => {
              e.preventDefault();
              setOpenId(open ? null : p.id);
            }}
            onTouchStart={(e) => {
              startX.current = e.touches[0]?.clientX ?? 0;
              timer.current = setTimeout(() => setOpenId(p.id), 450);
            }}
            onTouchMove={(e) => {
              if (timer.current) clearTimeout(timer.current);
              const dx = (e.touches[0]?.clientX ?? 0) - startX.current;
              if (dx < -40) setOpenId(p.id);
              if (dx > 40) setOpenId(null);
            }}
            onTouchEnd={() => timer.current && clearTimeout(timer.current)}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{formatDate(p.date)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground num">
                  {nf(Number(p.litres), 1)} L · {nf0(Number(p.km))} km
                  {p.cout != null ? ` · ${nf(Number(p.cout))} €` : ""}
                </p>
              </div>
              <span className="text-lg font-bold text-primary num">{nf(conso)}</span>
              <span className="text-xs text-muted-foreground">L/100</span>
            </div>
            {open && (
              <div className="flex gap-2 border-t border-border bg-secondary/60 px-4 py-2">
                <button
                  onClick={() => {
                    setOpenId(null);
                    onEdit(p);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary py-2 text-sm font-medium"
                >
                  <Pencil className="size-4" /> Modifier
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
  );
}
