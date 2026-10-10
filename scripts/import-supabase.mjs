// Importa i dati di un vecchio progetto Supabase nel Postgres locale.
//
// Uso (dopo aver creato il tuo account nell'app con la stessa email di Supabase):
//   SUPABASE_DB_URL="postgresql://postgres.xxxx:PASSWORD@host:5432/postgres" \
//     node --env-file=.env.local scripts/import-supabase.mjs
//
// Idempotente: le righe già presenti (stesso id) vengono saltate.

import pg from "pg";

const sourceUrl = process.env.SUPABASE_DB_URL;
const targetUrl = process.env.DATABASE_URL;
if (!sourceUrl || !targetUrl) {
  console.error("Servono SUPABASE_DB_URL e DATABASE_URL.");
  process.exit(1);
}

const source = new pg.Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
const target = new pg.Client({ connectionString: targetUrl });

// Ordine che rispetta le chiavi esterne.
const TABLES = [
  "campaigns",
  "locations",
  "factions",
  "npcs",
  "npc_notes",
  "characters",
  "quests",
  "items",
  "lore_notes",
  "sessions",
  "session_notes",
  "session_key_points",
  "session_links",
  "encounters",
  "quest_links",
];

async function tableExists(client, name) {
  const { rows } = await client.query("select to_regclass($1) as t", [`public.${name}`]);
  return rows[0].t !== null;
}

async function targetColumns(name) {
  const { rows } = await target.query(
    "select column_name from information_schema.columns where table_schema = 'public' and table_name = $1",
    [name],
  );
  return new Set(rows.map((r) => r.column_name));
}

async function insertRows(table, rows) {
  if (rows.length === 0) return 0;
  const allowed = await targetColumns(table);
  const columns = Object.keys(rows[0]).filter((c) => allowed.has(c));
  let inserted = 0;
  for (const row of rows) {
    const values = columns.map((c) => {
      const v = row[c];
      return v !== null && typeof v === "object" && !(v instanceof Date) ? JSON.stringify(v) : v;
    });
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const res = await target.query(
      `insert into "${table}" (${columns.map((c) => `"${c}"`).join(", ")})
       values (${placeholders}) on conflict do nothing`,
      values,
    );
    inserted += res.rowCount ?? 0;
  }
  return inserted;
}

async function main() {
  await source.connect();
  await target.connect();

  // auth.users di Supabase -> users locali, abbinati per email.
  const { rows: srcUsers } = await source.query("select id, email from auth.users");
  const userMap = new Map();
  for (const u of srcUsers) {
    const { rows } = await target.query("select id from users where email = $1", [
      (u.email ?? "").toLowerCase(),
    ]);
    if (rows[0]) userMap.set(u.id, rows[0].id);
    else console.warn(`! Nessun account locale per ${u.email}: i suoi dati verranno saltati.`);
  }
  if (userMap.size === 0) {
    throw new Error("Nessun utente abbinato: crea prima il tuo account nell'app con la stessa email.");
  }

  await target.query("begin");
  try {
    for (const table of TABLES) {
      if (!(await tableExists(source, table))) {
        console.log(`- ${table}: non presente su Supabase, saltata`);
        continue;
      }
      let { rows } = await source.query(`select * from public."${table}"`);
      if (table === "campaigns") {
        rows = rows
          .filter((r) => userMap.has(r.owner_id))
          .map((r) => ({ ...r, owner_id: userMap.get(r.owner_id) }));
      }
      console.log(`- ${table}: ${await insertRows(table, rows)}/${rows.length} righe importate`);
    }

    // Le vecchie relazioni quest<->NPC diventano quest_links di tipo "npc".
    if (await tableExists(source, "quest_npcs")) {
      const { rows } = await source.query("select campaign_id, quest_id, npc_id from public.quest_npcs");
      const links = rows.map((r) => ({
        campaign_id: r.campaign_id,
        quest_id: r.quest_id,
        entity_type: "npc",
        entity_id: r.npc_id,
      }));
      console.log(`- quest_npcs -> quest_links: ${await insertRows("quest_links", links)}/${links.length}`);
    }

    if (await tableExists(source, "user_settings")) {
      const { rows } = await source.query("select * from public.user_settings");
      const mapped = rows
        .filter((r) => userMap.has(r.user_id))
        .map((r) => ({ ...r, user_id: userMap.get(r.user_id) }));
      console.log(`- user_settings: ${await insertRows("user_settings", mapped)}/${mapped.length}`);
    }

    await target.query("commit");
    console.log("Importazione completata.");
  } catch (err) {
    await target.query("rollback");
    throw err;
  }
}

main()
  .catch((err) => {
    console.error("Importazione fallita:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await source.end().catch(() => {});
    await target.end().catch(() => {});
  });
