/* eslint-disable @typescript-eslint/no-explicit-any */
import { types } from "pg";
import { getPool } from "./pool";

// Le date tornano come stringhe ISO (come faceva PostgREST), non come Date.
types.setTypeParser(1184, (v) => new Date(v).toISOString());
types.setTypeParser(1114, (v) => new Date(`${v}Z`).toISOString());

type Scope = "owner" | "user" | "campaign" | "session";

// Isolamento per utente: sostituisce le policy RLS di Supabase.
const TABLE_SCOPE: Record<string, Scope> = {
  campaigns: "owner",
  user_settings: "user",
  locations: "campaign",
  factions: "campaign",
  npcs: "campaign",
  npc_notes: "campaign",
  characters: "campaign",
  quests: "campaign",
  quest_links: "campaign",
  items: "campaign",
  lore_notes: "campaign",
  sessions: "campaign",
  session_links: "campaign",
  encounters: "campaign",
  session_notes: "session",
  session_key_points: "session",
  session_ai_messages: "session",
};

const CONFLICT_KEY: Record<string, string> = { user_settings: "user_id" };

const IDENT = /^[a-z_][a-z0-9_]*$/;

function ident(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Identificatore non valido: ${name}`);
  return `"${name}"`;
}

export interface DbError {
  message: string;
  code?: string;
}

export interface DbResult<T> {
  data: T | null;
  error: DbError | null;
  count: number | null;
}

type Op = "select" | "insert" | "update" | "delete" | "upsert";
type Filter = { col: string; kind: "eq" | "neq" | "in" | "ilike"; val: unknown };

export class QueryBuilder<R = any[]> implements PromiseLike<DbResult<R>> {
  private op: Op = "select";
  private cols = "*";
  private returning = false;
  private countExact = false;
  private head = false;
  private filters: Filter[] = [];
  private orders: { col: string; asc: boolean; nullsFirst?: boolean }[] = [];
  private limitN: number | null = null;
  private rows: Record<string, unknown>[] = [];
  private patch: Record<string, unknown> = {};
  private mode: "many" | "single" | "maybe" = "many";

  constructor(
    private table: string,
    private getUserId: () => Promise<string | null>,
  ) {
    if (!TABLE_SCOPE[table]) throw new Error(`Tabella non consentita: ${table}`);
  }

  select(columns = "*", opts?: { count?: "exact"; head?: boolean }): this {
    if (this.op === "select") this.cols = columns;
    else {
      this.cols = columns;
      this.returning = true;
    }
    if (opts?.count) this.countExact = true;
    if (opts?.head) this.head = true;
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]): this {
    this.op = "insert";
    this.rows = Array.isArray(values) ? values : [values];
    return this;
  }

  upsert(values: Record<string, unknown> | Record<string, unknown>[]): this {
    this.op = "upsert";
    this.rows = Array.isArray(values) ? values : [values];
    return this;
  }

  update(values: Record<string, unknown>): this {
    this.op = "update";
    this.patch = values;
    return this;
  }

  delete(): this {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: unknown): this {
    this.filters.push({ col, kind: "eq", val });
    return this;
  }
  neq(col: string, val: unknown): this {
    this.filters.push({ col, kind: "neq", val });
    return this;
  }
  in(col: string, val: unknown[]): this {
    this.filters.push({ col, kind: "in", val });
    return this;
  }
  ilike(col: string, val: string): this {
    this.filters.push({ col, kind: "ilike", val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }): this {
    this.orders.push({ col, asc: opts?.ascending ?? true, nullsFirst: opts?.nullsFirst });
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  returns<T>(): QueryBuilder<T> {
    return this as unknown as QueryBuilder<T>;
  }
  single<T = any>(): QueryBuilder<T> {
    this.mode = "single";
    return this as unknown as QueryBuilder<T>;
  }
  maybeSingle<T = any>(): QueryBuilder<T> {
    this.mode = "maybe";
    return this as unknown as QueryBuilder<T>;
  }

  then<TResult1 = DbResult<R>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<R>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private columnList(): string {
    if (this.cols.trim() === "*") return "*";
    return this.cols
      .split(",")
      .map((c) => ident(c.trim()))
      .join(", ");
  }

  private async execute(): Promise<DbResult<R>> {
    try {
      const userId = await this.getUserId();
      if (!userId) return fail("Non autenticato.", "401");
      return await this.run(userId);
    } catch (err) {
      const e = err as { message?: string; code?: string };
      return fail(e.message ?? "Errore del database.", e.code);
    }
  }

  private scopeSql(userId: string, params: unknown[]): string {
    params.push(userId);
    const p = `$${params.length}`;
    switch (TABLE_SCOPE[this.table]) {
      case "owner":
        return `owner_id = ${p}`;
      case "user":
        return `user_id = ${p}`;
      case "campaign":
        return `campaign_id in (select id from campaigns where owner_id = ${p})`;
      case "session":
        return `session_id in (select s.id from sessions s join campaigns c on c.id = s.campaign_id where c.owner_id = ${p})`;
    }
  }

  private whereSql(userId: string, params: unknown[]): string {
    const parts = this.filters.map((f) => {
      const col = ident(f.col);
      if (f.kind === "in") {
        const list = f.val as unknown[];
        if (list.length === 0) return "false";
        params.push(list);
        return `${col} = any($${params.length})`;
      }
      if (f.val === null) return f.kind === "neq" ? `${col} is not null` : `${col} is null`;
      params.push(f.val);
      const p = `$${params.length}`;
      if (f.kind === "ilike") return `${col} ilike ${p}`;
      return `${col} ${f.kind === "neq" ? "<>" : "="} ${p}`;
    });
    parts.push(this.scopeSql(userId, params));
    return parts.join(" and ");
  }

  private async assertParents(userId: string, records: Record<string, unknown>[]) {
    const scope = TABLE_SCOPE[this.table];
    if (scope !== "campaign" && scope !== "session") return;
    const key = scope === "campaign" ? "campaign_id" : "session_id";
    const ids = [...new Set(records.map((r) => r[key]).filter((v): v is string => !!v))];
    if (ids.length === 0) return;
    const sql =
      scope === "campaign"
        ? "select count(*)::int as n from campaigns where id = any($1) and owner_id = $2"
        : "select count(*)::int as n from sessions s join campaigns c on c.id = s.campaign_id where s.id = any($1) and c.owner_id = $2";
    const { rows } = await getPool().query<{ n: number }>(sql, [ids, userId]);
    if (rows[0].n !== ids.length) throw new Error("Operazione non consentita.");
  }

  private async run(userId: string): Promise<DbResult<R>> {
    const pool = getPool();
    const table = ident(this.table);
    const params: unknown[] = [];
    let sql: string;

    if (this.op === "select") {
      const where = this.whereSql(userId, params);
      if (this.head) {
        const { rows } = await pool.query<{ n: number }>(
          `select count(*)::int as n from ${table} where ${where}`,
          params,
        );
        return { data: null, error: null, count: rows[0].n };
      }
      sql = `select ${this.columnList()} from ${table} where ${where}`;
      if (this.orders.length) {
        sql +=
          " order by " +
          this.orders
            .map(
              (o) =>
                `${ident(o.col)} ${o.asc ? "asc" : "desc"}` +
                (o.nullsFirst === undefined ? "" : o.nullsFirst ? " nulls first" : " nulls last"),
            )
            .join(", ");
      }
      if (this.limitN !== null) sql += ` limit ${Number(this.limitN) | 0}`;
    } else if (this.op === "insert" || this.op === "upsert") {
      let records = this.rows;
      if (TABLE_SCOPE[this.table] === "owner") records = records.map((r) => ({ ...r, owner_id: userId }));
      if (TABLE_SCOPE[this.table] === "user") records = records.map((r) => ({ ...r, user_id: userId }));
      await this.assertParents(userId, records);
      if (records.length === 0) return { data: null, error: null, count: null };

      const columns = [...new Set(records.flatMap((r) => Object.keys(r)))];
      const tuples = records.map(
        (r) =>
          "(" +
          columns
            .map((c) => {
              const v = r[c];
              if (v === undefined) return "default";
              params.push(v);
              return `$${params.length}`;
            })
            .join(", ") +
          ")",
      );
      sql = `insert into ${table} (${columns.map(ident).join(", ")}) values ${tuples.join(", ")}`;
      if (this.op === "upsert") {
        const conflict = CONFLICT_KEY[this.table] ?? "id";
        const updates = columns.filter((c) => c !== conflict);
        sql += ` on conflict (${ident(conflict)}) do ` +
          (updates.length
            ? `update set ${updates.map((c) => `${ident(c)} = excluded.${ident(c)}`).join(", ")}`
            : "nothing");
      }
    } else if (this.op === "update") {
      const entries = Object.entries(this.patch).filter(([, v]) => v !== undefined);
      if (entries.length === 0) return { data: null, error: null, count: null };
      await this.assertParents(userId, [this.patch]);
      const sets = entries.map(([c, v]) => {
        params.push(v);
        return `${ident(c)} = $${params.length}`;
      });
      sql = `update ${table} set ${sets.join(", ")} where ${this.whereSql(userId, params)}`;
    } else {
      sql = `delete from ${table} where ${this.whereSql(userId, params)}`;
    }

    if (this.op !== "select") {
      if (this.returning) sql += ` returning ${this.columnList()}`;
    }

    const result = await pool.query(sql, params);
    const returnsRows = this.op === "select" || this.returning;
    const rows = returnsRows ? result.rows : [];

    if (this.mode === "single") {
      if (rows.length !== 1) {
        return fail("JSON object requested, multiple (or no) rows returned", "PGRST116");
      }
      return { data: rows[0] as R, error: null, count: null };
    }
    if (this.mode === "maybe") {
      if (rows.length > 1) {
        return fail("JSON object requested, multiple rows returned", "PGRST116");
      }
      return { data: (rows[0] ?? null) as R | null, error: null, count: null };
    }
    return { data: returnsRows ? (rows as R) : null, error: null, count: null };
  }
}

function fail<T>(message: string, code?: string): DbResult<T> {
  return { data: null, error: { message, code }, count: null };
}
