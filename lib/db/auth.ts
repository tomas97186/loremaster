import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getPool } from "./pool";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "lm_session";
const SESSION_DAYS = 30;

export interface AuthUser {
  id: string;
  email: string;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await getPool().query(
    "insert into auth_sessions (token_hash, user_id, expires_at) values ($1, $2, $3)",
    [hashToken(token), userId, expires],
  );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.COOKIE_SECURE === "true",
    expires,
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { rows } = await getPool().query<AuthUser>(
    `select u.id, u.email
       from auth_sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { rows } = await getPool().query<{ id: string; password_hash: string }>(
    "select id, password_hash from users where email = $1",
    [email.toLowerCase()],
  );
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: "Email o password non corrette." };
  }
  await startSession(user.id);
  return { error: null };
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const normalized = email.toLowerCase();
  const existing = await getPool().query("select 1 from users where email = $1", [normalized]);
  if (existing.rowCount) return { error: "Esiste già un account con questa email." };

  const { rows } = await getPool().query<{ id: string }>(
    "insert into users (email, password_hash) values ($1, $2) returning id",
    [normalized, await hashPassword(password)],
  );
  await startSession(rows[0].id);
  return { error: null };
}

export async function signOutCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await getPool().query("delete from auth_sessions where token_hash = $1", [hashToken(token)]);
  }
  cookieStore.delete(SESSION_COOKIE);
}
