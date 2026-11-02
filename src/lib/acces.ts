/**
 * Garde des fonctions serveur : chacune déclare `.middleware([exigerAcces])`,
 * qui refuse si Cloudflare Access n'a pas authentifié la requête.
 */
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { emailAcces } from "@/lib/acces.server";

/** URL de sortie d'Access : elle efface la session Access sur ce domaine. */
export const URL_DECONNEXION = "/cdn-cgi/access/logout";

export const exigerAcces = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const email = await emailAcces(getRequest());
  if (!email) throw new Error("Accès refusé");
  return next({ context: { email } });
});

/** Email authentifié par Access ; échoue (middleware) quand il n'y en a pas. */
export const quiSuisJe = createServerFn({ method: "GET" })
  .middleware([exigerAcces])
  .handler(async ({ context }) => {
    return { email: context.email };
  });
