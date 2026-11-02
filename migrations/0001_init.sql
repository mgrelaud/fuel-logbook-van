-- Boîte noire sur D1 (SQLite), reprise du schéma Postgres de Lovable Cloud.
-- Une seule personne derrière Cloudflare Access : plus de user_id ni de RLS.
-- tags et extra sont du JSON texte ; dates et heures restent du texte ISO.

CREATE TABLE rubriques (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL CHECK (trim(nom) <> ''),
  icone TEXT NOT NULL DEFAULT 'Sparkles',
  couleur TEXT NOT NULL DEFAULT 'orange',
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE fiches (
  id TEXT PRIMARY KEY,
  rubrique_id TEXT NOT NULL REFERENCES rubriques (id) ON DELETE CASCADE,
  titre TEXT NOT NULL CHECK (trim(titre) <> ''),
  sous_titre TEXT,
  date TEXT,
  heure TEXT,
  lieu TEXT,
  ville TEXT,
  statut TEXT NOT NULL DEFAULT 'vu' CHECK (statut IN ('vu', 'reserve', 'envie', 'annule')),
  note INTEGER CHECK (note BETWEEN 0 AND 5),
  avis TEXT,
  prix REAL CHECK (prix >= 0),
  places INTEGER CHECK (places > 0),
  tags TEXT NOT NULL DEFAULT '[]',
  extra TEXT NOT NULL DEFAULT '{}',
  -- Clé d'origine pour un import : rejouer l'import ne crée pas de doublon.
  source TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX fiches_date_idx ON fiches (date DESC);
CREATE INDEX fiches_rubrique_idx ON fiches (rubrique_id, date DESC);

CREATE TABLE pleins (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL DEFAULT (date('now')),
  litres REAL NOT NULL CHECK (litres > 0),
  -- Distance du totaliseur partiel (ancienne saisie, conservée pour l'historique).
  km REAL CHECK (km > 0),
  -- Relevé du compteur kilométrique total au moment du plein.
  compteur REAL CHECK (compteur >= 0),
  cout REAL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX pleins_date_idx ON pleins (date DESC, created_at DESC);
