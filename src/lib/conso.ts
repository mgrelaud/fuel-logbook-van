export type Plein = {
  id: string;
  date: string;
  litres: number;
  km: number | null;
  cout: number | null;
  created_at: string;
};

export const litresPer100 = (litres: number, km: number) => (litres / km) * 100;

export const nf = (value: number, digits = 2) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const nf0 = (value: number) => new Intl.NumberFormat("fr-FR").format(Math.round(value));

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }).format(
    new Date(`${iso}T00:00:00`),
  );

export const sortAsc = (pleins: Plein[]) =>
  [...pleins].sort(
    (a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at),
  );

export type Bloc = {
  /** pleins du bloc, par date croissante ; le dernier clôture le bloc s'il est clôturé */
  pleins: Plein[];
  litres: number;
  cout: number;
  km: number | null;
  conso: number | null;
  cloture: boolean;
};

/** Recalcule intégralement les blocs à partir des données brutes. */
export function computeBlocs(pleins: Plein[]): Bloc[] {
  const blocs: Bloc[] = [];
  let courant: Plein[] = [];

  for (const p of sortAsc(pleins)) {
    courant.push(p);
    const km = p.km == null ? null : Number(p.km);
    if (km != null && km > 0) {
      const litres = courant.reduce((s, x) => s + Number(x.litres), 0);
      blocs.push({
        pleins: courant,
        litres,
        cout: courant.reduce((s, x) => s + Number(x.cout ?? 0), 0),
        km,
        conso: litresPer100(litres, km),
        cloture: true,
      });
      courant = [];
    }
  }

  if (courant.length > 0) {
    blocs.push({
      pleins: courant,
      litres: courant.reduce((s, x) => s + Number(x.litres), 0),
      cout: courant.reduce((s, x) => s + Number(x.cout ?? 0), 0),
      km: null,
      conso: null,
      cloture: false,
    });
  }

  return blocs;
}

export type Totaux = {
  km: number;
  litres: number;
  cout: number;
  moyenne: number | null;
  coutPour100: number | null;
  litresEnAttente: number;
};

export function computeTotaux(pleins: Plein[]): Totaux {
  const blocs = computeBlocs(pleins);
  const clos = blocs.filter((b) => b.cloture);
  const km = clos.reduce((s, b) => s + (b.km ?? 0), 0);
  const litresClos = clos.reduce((s, b) => s + b.litres, 0);
  const coutClos = clos.reduce((s, b) => s + b.cout, 0);
  const litres = pleins.reduce((s, p) => s + Number(p.litres), 0);
  const cout = pleins.reduce((s, p) => s + Number(p.cout ?? 0), 0);
  const enAttente = blocs.find((b) => !b.cloture);

  return {
    km,
    litres,
    cout,
    moyenne: km > 0 ? (litresClos / km) * 100 : null,
    coutPour100: km > 0 && coutClos > 0 ? (coutClos / km) * 100 : null,
    litresEnAttente: enAttente ? enAttente.litres : 0,
  };
}

export function toCsv(pleins: Plein[]): string {
  const header = ["date", "litres", "km", "type", "L/100km_bloc", "cout_eur", "prix_au_litre"];
  const rows: string[] = [];

  for (const bloc of computeBlocs(pleins)) {
    for (const p of bloc.pleins) {
      const cloture = p.km != null && Number(p.km) > 0;
      const prix = p.cout != null ? Number(p.cout) / Number(p.litres) : null;
      rows.push(
        [
          p.date,
          String(p.litres),
          p.km != null ? String(p.km) : "",
          cloture ? "cloturant" : "intermediaire",
          cloture && bloc.conso != null ? bloc.conso.toFixed(2) : "",
          p.cout != null ? String(p.cout) : "",
          prix != null ? prix.toFixed(3) : "",
        ].join(";"),
      );
    }
  }

  return [header.join(";"), ...rows].join("\n");
}

export function downloadCsv(pleins: Plein[]) {
  const blob = new Blob(["\uFEFF" + toCsv(pleins)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `conso-cc-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseNumber(value: string): number {
  return Number(value.replace(",", ".").trim());
}
