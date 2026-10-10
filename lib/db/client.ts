/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentUser, type AuthUser } from "./auth";
import { QueryBuilder } from "./query";

/**
 * Client dati per Server Component e Server Action. Espone la stessa forma
 * `from(...).select(...).eq(...)` usata in tutta l'app, ma parla direttamente
 * con Postgres e limita ogni query ai dati dell'utente loggato.
 */
export async function createClient() {
  let userPromise: Promise<AuthUser | null> | null = null;
  const currentUser = () => (userPromise ??= getCurrentUser());

  return {
    from: (table: string) => new QueryBuilder<any[]>(table, async () => (await currentUser())?.id ?? null),
    auth: {
      getUser: async () => ({ data: { user: await currentUser() } }),
    },
  };
}
