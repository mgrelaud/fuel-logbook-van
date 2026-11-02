/**
 * Qui parle au serveur ?
 *
 * Plus de compte Apple : Cloudflare Access, placé devant le Worker, authentifie
 * (code reçu par email) et n'ouvre qu'aux adresses autorisées. Il transmet alors
 * un JWT signé dans l'en-tête Cf-Access-Jwt-Assertion ; on le vérifie ici plutôt
 * que de croire l'en-tête d'email en clair, pour que les données restent fermées
 * même si Access était un jour désactivé par erreur.
 */
import { env } from "cloudflare:workers";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

export async function emailAcces(req: Request): Promise<string | null> {
  const equipe = env.ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  if (equipe && env.ACCESS_AUD) {
    const jeton = req.headers.get("Cf-Access-Jwt-Assertion");
    if (!jeton) {
      console.warn("[access] en-tête Cf-Access-Jwt-Assertion absent");
      return null;
    }
    const issuer = `https://${equipe}`;
    jwks ??= createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    try {
      const { payload } = await jwtVerify(jeton, jwks, { issuer, audience: env.ACCESS_AUD });
      return typeof payload["email"] === "string" ? payload["email"].toLowerCase() : null;
    } catch (erreur) {
      let revendications: unknown = null;
      try {
        const { iss, aud } = decodeJwt(jeton);
        revendications = { iss, aud };
      } catch {
        // Jeton illisible : on journalise sans ses revendications.
      }
      console.warn("[access] jeton refusé :", (erreur as Error).message, revendications);
      return null;
    }
  }

  // Access non configuré : seul le développement local passe, avec l'email posé
  // dans .dev.vars (jamais déployé). En ligne, sans Access, personne n'entre.
  const { hostname } = new URL(req.url);
  if (env.DEV_USER_EMAIL && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return env.DEV_USER_EMAIL.toLowerCase();
  }
  return null;
}
