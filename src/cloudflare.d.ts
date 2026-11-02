/**
 * Ce que le runtime Workers fournit au serveur, déclaré à la main plutôt qu'avec
 * `wrangler types` : ces types globaux entreraient en conflit avec ceux du DOM,
 * le même tsconfig couvrant le client et le serveur.
 */
declare module "cloudflare:workers" {
  interface D1Result<T> {
    results: T[];
    meta: { changes: number };
  }
  interface D1PreparedStatement {
    bind(...valeurs: unknown[]): D1PreparedStatement;
    all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
    first<T = Record<string, unknown>>(): Promise<T | null>;
    run(): Promise<D1Result<never>>;
  }
  export interface D1Database {
    prepare(sql: string): D1PreparedStatement;
    batch(instructions: D1PreparedStatement[]): Promise<D1Result<unknown>[]>;
  }

  export const env: {
    DB: D1Database;
    /** Équipe Zero Trust, ex. « matthieu-grelaud.cloudflareaccess.com » */
    ACCESS_TEAM_DOMAIN?: string;
    /** « AUD tag » de l'application Access du Worker */
    ACCESS_AUD?: string;
    /** Développement local uniquement (.dev.vars) */
    DEV_USER_EMAIL?: string;
  };
}
