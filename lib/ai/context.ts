import type { createClient } from "@/lib/db/client";
import { stripHtml } from "@/lib/richtext";
import { QUEST_STATUS_LABELS, SESSION_STATUS_LABELS } from "@/lib/constants";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function section(title: string, lines: string[]): string {
  if (lines.length === 0) return "";
  return `## ${title}\n${lines.join("\n")}`;
}

function describe(label: string, value: string | null | undefined): string {
  const text = stripHtml(value);
  return text ? ` — ${text}` : "";
}

/**
 * Riassunto testuale di tutta la campagna (luoghi, NPC, fazioni, quest,
 * oggetti, personaggi, note di lore, sessioni), per dare all'assistente AI
 * cognizione completa del mondo già costruito. Pensato per campagne di
 * dimensioni personali (decine di elementi): nessun troncamento/RAG.
 */
export async function buildCampaignContext(
  supabase: SupabaseServerClient,
  campaignId: string,
): Promise<string> {
  const [
    { data: campaign },
    { data: locations },
    { data: npcs },
    { data: factions },
    { data: quests },
    { data: items },
    { data: characters },
    { data: loreNotes },
    { data: sessions },
  ] = await Promise.all([
    supabase.from("campaigns").select("*").eq("id", campaignId).single(),
    supabase.from("locations").select("*").eq("campaign_id", campaignId).order("name"),
    supabase.from("npcs").select("*").eq("campaign_id", campaignId).order("name"),
    supabase.from("factions").select("*").eq("campaign_id", campaignId).order("name"),
    supabase.from("quests").select("*").eq("campaign_id", campaignId).order("title"),
    supabase.from("items").select("*").eq("campaign_id", campaignId).order("name"),
    supabase.from("characters").select("*").eq("campaign_id", campaignId).order("name"),
    supabase.from("lore_notes").select("*").eq("campaign_id", campaignId).order("title"),
    supabase
      .from("sessions")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("session_number", { ascending: false }),
  ]);

  const locationNameById = new Map((locations ?? []).map((l) => [l.id, l.name as string]));
  const factionNameById = new Map((factions ?? []).map((f) => [f.id, f.name as string]));
  const npcNameById = new Map((npcs ?? []).map((n) => [n.id, n.name as string]));

  const locationLines = (locations ?? []).map((l) => {
    const parent = l.parent_id ? locationNameById.get(l.parent_id) : null;
    const type = l.type ? ` (${l.type})` : "";
    const parentInfo = parent ? `, dentro: ${parent}` : "";
    return `- ${l.name}${type}${parentInfo}${describe("descrizione", l.description)}`;
  });

  const npcLines = (npcs ?? []).map((n) => {
    const role = n.role ? ` — ${n.role}` : "";
    const where = n.location_id ? `, a: ${locationNameById.get(n.location_id) ?? "?"}` : "";
    const faction = n.faction_id ? `, fazione: ${factionNameById.get(n.faction_id) ?? "?"}` : "";
    return `- ${n.name}${role}${where}${faction}${describe("descrizione", n.description)}`;
  });

  const factionLines = (factions ?? []).map(
    (f) => `- ${f.name}${describe("descrizione", f.description)}${describe("obiettivi", f.goals)}`,
  );

  const questLines = (quests ?? []).map((q) => {
    const status = QUEST_STATUS_LABELS[q.status] ?? q.status;
    const where = q.location_id ? `, a: ${locationNameById.get(q.location_id) ?? "?"}` : "";
    return `- ${q.title} [${status}]${where}${describe("descrizione", q.description)}`;
  });

  const itemLines = (items ?? []).map((i) => {
    const type = i.item_type ? ` (${i.item_type})` : "";
    const owner = i.owner_npc_id ? `, di: ${npcNameById.get(i.owner_npc_id) ?? "?"}` : "";
    const where = i.location_id ? `, a: ${locationNameById.get(i.location_id) ?? "?"}` : "";
    return `- ${i.name}${type}${owner}${where}${describe("descrizione", i.description)}`;
  });

  const characterLines = (characters ?? []).map((c) => {
    const player = c.player_name ? ` (giocato da ${c.player_name})` : "";
    const build = [c.race, c.class].filter(Boolean).join(" ");
    return `- ${c.name}${player}${build ? ` — ${build}` : ""}${describe("descrizione", c.description)}`;
  });

  const loreLines = (loreNotes ?? []).map(
    (n) => `- ${n.title}${describe("contenuto", n.content)}`,
  );

  const sessionLines = (sessions ?? []).map((s) => {
    const status = SESSION_STATUS_LABELS[s.status] ?? s.status;
    const number = s.session_number ? `#${s.session_number} ` : "";
    return `- ${number}${s.title} [${status}]${describe("riassunto", s.summary)}`;
  });

  const parts = [
    campaign
      ? `# Campagna: ${campaign.name}${campaign.system ? ` (${campaign.system})` : ""}\n${
          [
            campaign.setting ? `Ambientazione: ${campaign.setting}` : null,
            campaign.level_or_period ? `Livello/periodo: ${campaign.level_or_period}` : null,
            stripHtml(campaign.description),
          ]
            .filter(Boolean)
            .join("\n")
        }`
      : null,
    section("Luoghi", locationLines),
    section("NPC", npcLines),
    section("Fazioni", factionLines),
    section("Quest", questLines),
    section("Oggetti", itemLines),
    section("Personaggi dei giocatori", characterLines),
    section("Note di lore", loreLines),
    section("Sessioni", sessionLines),
  ].filter(Boolean);

  return parts.join("\n\n");
}
