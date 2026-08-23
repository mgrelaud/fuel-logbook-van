export type Plein = {
  id: string;
  date: string;
  litres: number;
  km: number;
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

export type Totaux = {
  km: number;
  litres: number;
  cout: number;
  moyenne: number | null;
  coutPour100: number | null;
};

export function computeTotaux(pleins: Plein[]): Totaux {
  const km = pleins.reduce((s, p) => s + Number(p.km), 0);
  const litres = pleins.reduce((s, p) => s + Number(p.litres), 0);
  const cout = pleins.reduce((s, p) => s + Number(p.cout ?? 0), 0);
  return {
    km,
    litres,
    cout,
    moyenne: km > 0 ? (litres / km) * 100 : null,
    coutPour100: km > 0 && cout > 0 ? (cout / km) * 100 : null,
  };
}

export function toCsv(pleins: Plein[]): string {
  const header = ["date", "litres", "km", "L/100km", "cout_eur", "prix_au_litre"];
  const rows = pleins.map((p) => {
    const conso = litresPer100(Number(p.litres), Number(p.km));
    const prix = p.cout != null ? Number(p.cout) / Number(p.litres) : null;
    return [
      p.date,
      String(p.litres),
      String(p.km),
      conso.toFixed(2),
      p.cout != null ? String(p.cout) : "",
      prix != null ? prix.toFixed(3) : "",
    ].join(";");
  });
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
