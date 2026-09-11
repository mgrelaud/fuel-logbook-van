import { Star } from "lucide-react";

/**
 * Notation sur 5 étoiles. Recliquer sur la dernière étoile active retire la
 * note — sinon on ne pourrait plus revenir à « pas encore noté ».
 */
export function Note({
  note,
  onChange,
  taille = "size-5",
}: {
  note: number | null;
  onChange?: (note: number | null) => void;
  taille?: string;
}) {
  const lecture = !onChange;

  return (
    <div
      className="flex items-center gap-0.5"
      role={lecture ? "img" : "radiogroup"}
      aria-label={note != null ? `Noté ${note} sur 5` : "Pas encore noté"}
    >
      {[1, 2, 3, 4, 5].map((valeur) => {
        const plein = note != null && valeur <= note;
        return (
          <button
            key={valeur}
            type="button"
            disabled={lecture}
            aria-label={`${valeur} sur 5`}
            onClick={(e) => {
              e.stopPropagation();
              onChange?.(note === valeur ? null : valeur);
            }}
            className={lecture ? "cursor-default" : "p-0.5 active:scale-90"}
          >
            <Star
              className={`${taille} ${plein ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
