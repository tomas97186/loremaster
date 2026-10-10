import { Pool } from "pg";

const globalForPool = globalThis as unknown as { __loremasterPool?: Pool };

export function getPool(): Pool {
  if (!globalForPool.__loremasterPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL non è impostata.");
    globalForPool.__loremasterPool = new Pool({ connectionString, max: 10 });
  }
  return globalForPool.__loremasterPool;
}
