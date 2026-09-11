import { Search, X } from "lucide-react";

export function BarreRecherche({
  valeur,
  onChange,
  placeholder = "Rechercher…",
}: {
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        className="w-full rounded-2xl border border-border bg-card py-3.5 pr-11 pl-11 text-base outline-none focus:border-primary/60"
      />
      {valeur && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-secondary p-1.5 text-muted-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
