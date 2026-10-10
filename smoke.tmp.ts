import fs from "node:fs";
process.env.DATABASE_URL = fs.readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.*)$/m)![1].trim();
import { runMigrations } from "./lib/db/migrate";
import { QueryBuilder } from "./lib/db/query";
import { getPool } from "./lib/db/pool";

const mk = (t: string, u: string) => new QueryBuilder<any[]>(t, async () => u);
(async () => {
  await runMigrations();
  await runMigrations(); // idempotente
  const pool = getPool();
  const u1 = (await pool.query("insert into users(email,password_hash) values ('smoke1@x.it','x') returning id")).rows[0].id;
  const u2 = (await pool.query("insert into users(email,password_hash) values ('smoke2@x.it','x') returning id")).rows[0].id;
  try {
    const camp = await mk("campaigns", u1).insert({ name: "Test", owner_id: u2 }).select("id,owner_id,created_at").single();
    console.log("campagna", camp.error, camp.data.owner_id === u1 ? "owner forzato ok" : "OWNER ERRATO", typeof camp.data.created_at);
    const cid = camp.data.id;
    const npc = await mk("npcs", u1).insert({ campaign_id: cid, name: "Gandalf" }).select("id").single();
    console.log("npc", npc.error, !!npc.data?.id);
    const mine = await mk("npcs", u1).select("id,name").eq("campaign_id", cid).order("name");
    const theirs = await mk("npcs", u2).select("id,name").eq("campaign_id", cid);
    console.log("u1 vede", mine.data?.length, "| u2 vede", theirs.data?.length);
    const hack = await mk("npcs", u2).insert({ campaign_id: cid, name: "Intruso" });
    console.log("insert altrui:", hack.error?.message);
    const upd = await mk("npcs", u2).update({ name: "Hack" }).eq("id", npc.data.id);
    const after = await mk("npcs", u1).select("name").eq("id", npc.data.id).single();
    console.log("update altrui non applicato:", after.data.name);
    const cnt = await mk("npcs", u1).select("id", { count: "exact", head: true }).eq("campaign_id", cid);
    console.log("count", cnt.count);
    const st = await mk("user_settings", u1).upsert({ user_id: u1, ai_provider: "claude" });
    const st2 = await mk("user_settings", u1).upsert({ user_id: u1, ai_provider: "gemini" });
    const got = await mk("user_settings", u1).select("ai_provider").maybeSingle();
    console.log("settings", st.error, st2.error, got.data);
    const miss = await mk("npcs", u1).select("id").eq("id", "00000000-0000-0000-0000-000000000000").single();
    console.log("single mancante:", miss.error?.code);
  } finally {
    await pool.query("delete from users where email in ('smoke1@x.it','smoke2@x.it')");
    await pool.end();
  }
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
