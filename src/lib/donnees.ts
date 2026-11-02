/**
 * Fonctions serveur de la Boîte noire : le navigateur ne parle plus à une base,
 * il appelle ces fonctions, qui vérifient Cloudflare Access puis lisent ou
 * écrivent dans D1 (voir d1.server.ts).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { exigerAcces } from "@/lib/acces";
import {
  inserer,
  lireFiches,
  lirePleins,
  lireRubriques,
  mettreAJour,
  supprimer,
} from "@/lib/d1.server";
import { STATUTS } from "@/lib/fiches";

const valeursFiche = z.object({
  rubrique_id: z.string(),
  titre: z.string().trim().min(1),
  sous_titre: z.string().nullable(),
  date: z.string().nullable(),
  heure: z.string().nullable(),
  lieu: z.string().nullable(),
  ville: z.string().nullable(),
  statut: z.enum(STATUTS),
  note: z.number().int().min(0).max(5).nullable(),
  avis: z.string().nullable(),
  prix: z.number().min(0).nullable(),
  places: z.number().int().positive().nullable(),
  tags: z.array(z.string()),
});

const valeursRubrique = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  nom: z.string().trim().min(1),
  icone: z.string(),
  couleur: z.string(),
  ordre: z.number().int(),
});

const valeursPlein = z.object({
  date: z.string(),
  litres: z.number().positive(),
  km: z.number().positive().nullable(),
  compteur: z.number().min(0).nullable(),
  cout: z.number().nullable(),
});

const parId = z.string();

// ---------------------------------------------------------------- rubriques

export const listerRubriques = createServerFn({ method: "GET" })
  .middleware([exigerAcces])
  .handler(() => lireRubriques());

export const enregistrerRubrique = createServerFn({ method: "POST" })
  .middleware([exigerAcces])
  .inputValidator(z.object({ id: z.string().optional(), valeurs: valeursRubrique }))
  .handler(async ({ data }) => {
    if (data.id) await mettreAJour("rubriques", data.id, data.valeurs);
    else await inserer("rubriques", data.valeurs);
  });

/** Ses fiches partent avec elle (ON DELETE CASCADE). */
export const supprimerRubrique = createServerFn({ method: "POST" })
  .middleware([exigerAcces])
  .inputValidator(parId)
  .handler(({ data }) => supprimer("rubriques", data));

// ---------------------------------------------------------------- fiches

export const listerFiches = createServerFn({ method: "GET" })
  .middleware([exigerAcces])
  .handler(() => lireFiches());

export const enregistrerFiche = createServerFn({ method: "POST" })
  .middleware([exigerAcces])
  .inputValidator(z.object({ id: z.string().optional(), valeurs: valeursFiche }))
  .handler(async ({ data }) => {
    if (data.id) await mettreAJour("fiches", data.id, data.valeurs);
    else await inserer("fiches", data.valeurs);
  });

export const noterFiche = createServerFn({ method: "POST" })
  .middleware([exigerAcces])
  .inputValidator(z.object({ id: z.string(), note: z.number().int().min(0).max(5).nullable() }))
  .handler(({ data }) => mettreAJour("fiches", data.id, { note: data.note }));

export const supprimerFiche = createServerFn({ method: "POST" })
  .middleware([exigerAcces])
  .inputValidator(parId)
  .handler(({ data }) => supprimer("fiches", data));

// ---------------------------------------------------------------- carburant

export const listerPleins = createServerFn({ method: "GET" })
  .middleware([exigerAcces])
  .handler(() => lirePleins());

export const enregistrerPlein = createServerFn({ method: "POST" })
  .middleware([exigerAcces])
  .inputValidator(z.object({ id: z.string().optional(), valeurs: valeursPlein }))
  .handler(async ({ data }) => {
    if (data.id) await mettreAJour("pleins", data.id, data.valeurs);
    else await inserer("pleins", data.valeurs);
  });

export const supprimerPlein = createServerFn({ method: "POST" })
  .middleware([exigerAcces])
  .inputValidator(parId)
  .handler(({ data }) => supprimer("pleins", data));
