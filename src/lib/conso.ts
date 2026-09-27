export type Plein = {
  id: string;
  date: string;
  litres: number;
  /** Distance lue sur le totaliseur partiel (ancienne saisie, conservée pour l'historique). */
  km: number | null;
  /** Relevé du compteur kilométrique total au moment du plein. */
  compteur: number | null;
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

const positif = (v: number | null) => (v != null && Number(v) > 0 ? Number(v) : null);
const releve = (p: Plein) => (p.compteur == null ? null : Number(p.compteur));

export type Bloc = {
  /** pleins du bloc, par date croissante ; le dernier clôture le bloc s'il est clôturé */
  pleins: Plein[];
  litres: number;
  cout: number;
  /** distance parcourue ; null si le bloc est en attente ou part du premier relevé */
  km: number | null;
  conso: number | null;
  cloture: boolean;
  /**
   * Bloc clos par un relevé de compteur sans relevé précédent : c'est le point
   * de départ du compteur, la distance qui y mène est inconnue et ses litres
   * n'entrent pas dans la moyenne.
   */
  depart: boolean;
  /** relevé du compteur qui clôt le bloc, s'il y en a un */
  compteur: number | null;
};

/**
 * Recalcule intégralement les blocs à partir des données brutes.
 *
 * Un plein clôt le bloc en cours quand il porte un relevé de compteur (la
 * distance est alors l'écart avec le relevé précédent) ou, pour l'historique
 * d'avant le compteur, une distance partielle `km`. Les pleins sans l'un ni
 * l'autre sont intermédiaires : leurs litres comptent au prochain plein qui
 * clôt.
 */
export function computeBlocs(pleins: Plein[]): Bloc[] {
  const blocs: Bloc[] = [];
  let courant: Plein[] = [];
  let dernierReleve: number | null = null;

  const clore = (km: number | null, compteur: number | null) => {
    const litres = courant.reduce((s, x) => s + Number(x.litres), 0);
    blocs.push({
      pleins: courant,
      litres,
      cout: courant.reduce((s, x) => s + Number(x.cout ?? 0), 0),
      km,
      conso: km != null ? litresPer100(litres, km) : null,
      cloture: true,
      depart: km == null,
      compteur,
    });
    courant = [];
  };

  for (const p of sortAsc(pleins)) {
    courant.push(p);
    const r = releve(p);
    if (r != null) {
      // Un relevé qui ne dépasse pas le précédent (faute de frappe, compteur
      // changé) repart de zéro plutôt que de produire une distance négative.
      clore(dernierReleve != null && r > dernierReleve ? r - dernierReleve : null, r);
      dernierReleve = r;
      continue;
    }
    const km = positif(p.km);
    if (km != null) clore(km, null);
  }

  if (courant.length > 0) {
    blocs.push({
      pleins: courant,
      litres: courant.reduce((s, x) => s + Number(x.litres), 0),
      cout: courant.reduce((s, x) => s + Number(x.cout ?? 0), 0),
      km: null,
      conso: null,
      cloture: false,
      depart: false,
      compteur: null,
    });
  }

  return blocs;
}

/** Le dernier plein d'un bloc clôturé est celui qui le clôt. */
export const estCloturant = (bloc: Bloc, p: Plein) =>
  bloc.cloture && bloc.pleins[bloc.pleins.length - 1]?.id === p.id;

/** Relevés de compteur qui encadrent un plein, pour contrôler la saisie. */
export function relevesAutour(pleins: Plein[], candidat: Plein) {
  const liste = sortAsc([...pleins.filter((p) => p.id !== candidat.id), candidat]);
  const i = liste.findIndex((p) => p.id === candidat.id);
  const avant =
    liste
      .slice(0, i)
      .reverse()
      .find((p) => releve(p) != null) ?? null;
  const apres = liste.slice(i + 1).find((p) => releve(p) != null) ?? null;
  return { avant, apres };
}

/** Le bloc auquel appartiendrait un plein saisi, tel qu'il serait calculé. */
export function blocDe(pleins: Plein[], candidat: Plein): Bloc | undefined {
  return computeBlocs([...pleins.filter((p) => p.id !== candidat.id), candidat]).find((b) =>
    b.pleins.some((p) => p.id === candidat.id),
  );
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
  const clos = blocs.filter((b) => b.km != null);
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
  const header = [
    "date",
    "litres",
    "compteur",
    "km_bloc",
    "type",
    "L/100km_bloc",
    "cout_eur",
    "prix_au_litre",
  ];
  const rows: string[] = [];

  for (const bloc of computeBlocs(pleins)) {
    for (const p of bloc.pleins) {
      const cloture = estCloturant(bloc, p);
      const type = !cloture ? "intermediaire" : bloc.depart ? "releve_depart" : "cloturant";
      const prix = p.cout != null ? Number(p.cout) / Number(p.litres) : null;
      rows.push(
        [
          p.date,
          String(p.litres),
          p.compteur != null ? String(p.compteur) : "",
          cloture && bloc.km != null ? String(bloc.km) : "",
          type,
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
