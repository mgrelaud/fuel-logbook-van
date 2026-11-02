#!/usr/bin/env python3
"""
Convertit les exports CSV de Lovable Cloud (Cloud → Database → Export, séparateur
« ; ») en un fichier SQL à appliquer sur D1.

    python3 -I scripts/csv-lovable-vers-d1.py rubriques.csv fiches.csv pleins.csv > import.sql
    npx wrangler d1 execute boite-noire --remote --config wrangler.jsonc --file import.sql

- `user_id` disparaît (une seule personne derrière Cloudflare Access) ;
- les horodatages Postgres (« 2026-09-11 15:49:21.701905+00 ») deviennent de
  l'ISO UTC (« 2026-09-11T15:49:21.701Z »), le format qu'écrit l'application ;
- tags et extra sont vérifiés comme JSON puis gardés tels quels ;
- l'import commence par vider les tables : il est rejouable tel quel.
"""

import csv
import json
import sys
from datetime import datetime, timezone

COLONNES = {
    "rubriques": ["id", "slug", "nom", "icone", "couleur", "ordre", "created_at"],
    "fiches": [
        "id", "rubrique_id", "titre", "sous_titre", "date", "heure", "lieu", "ville",
        "statut", "note", "avis", "prix", "places", "tags", "extra", "source",
        "created_at", "updated_at",
    ],
    "pleins": ["id", "date", "litres", "km", "compteur", "cout", "created_at"],
}
NOMBRES = {"ordre", "note", "prix", "places", "litres", "km", "compteur", "cout"}
HORODATAGES = {"created_at", "updated_at"}
JSON_ = {"tags": "[]", "extra": "{}"}


def iso(valeur):
    # Postgres : « 2026-09-11 15:49:21.701905+00 », fraction de longueur variable.
    tete, _, fraction = valeur.removesuffix("+00").partition(".")
    d = datetime.fromisoformat(tete).replace(tzinfo=timezone.utc)
    return d.strftime("%Y-%m-%dT%H:%M:%S.") + fraction.ljust(3, "0")[:3] + "Z"


def valeur(colonne, brut):
    if colonne in JSON_:
        texte = brut or JSON_[colonne]
        json.loads(texte)  # échoue sur un export abîmé
        return texte
    if brut == "":
        return None
    if colonne in NOMBRES:
        n = float(brut)
        return int(n) if n.is_integer() else n
    if colonne in HORODATAGES:
        return iso(brut)
    return brut


def sql(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + v.replace("'", "''") + "'"


def lire(chemin):
    with open(chemin, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f, delimiter=";"))


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    tables = dict(zip(["rubriques", "fiches", "pleins"], map(lire, sys.argv[1:])))

    for t, lignes in tables.items():
        if lignes and not lignes[0].keys() >= set(COLONNES[t]):
            sys.exit(f"{t} : colonnes inattendues {list(lignes[0].keys())} (fichiers dans le désordre ?)")

    ids_rubriques = {r["id"] for r in tables["rubriques"]}
    orphelines = [f["id"] for f in tables["fiches"] if f["rubrique_id"] not in ids_rubriques]
    if orphelines:
        sys.exit(f"Fiches sans rubrique connue : {orphelines}")

    print("-- Généré par scripts/csv-lovable-vers-d1.py — rejouable (vide les tables d'abord)")
    for t in ("fiches", "pleins", "rubriques"):
        print(f"DELETE FROM {t};")
    for t, colonnes in COLONNES.items():
        for ligne in tables[t]:
            vals = [sql(valeur(c, ligne[c])) for c in colonnes]
            print(f"INSERT INTO {t} ({', '.join(colonnes)}) VALUES ({', '.join(vals)});")
        print(f"-- {t}: {len(tables[t])}", file=sys.stderr)


if __name__ == "__main__":
    main()
