"use server";

import { createClient } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isEmptyHtml, stripHtml, textToHtml, linesToHtmlList } from "@/lib/richtext";
import { askAssistant, type AiTool } from "@/lib/ai/gateway";
import type { AiProvider, QuestLinkEntityType } from "@/lib/db/types";
import { withFlash } from "@/lib/utils";

const QUEST_LINKED_ENTITY_TYPES: QuestLinkEntityType[] = ["npc", "character", "faction", "item"];

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length ? value : null;
}

function optionalRichText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "");
  return isEmptyHtml(value) ? null : value;
}

function fieldsFrom(formData: FormData, campaignId: string) {
  const status = String(formData.get("status") ?? "idea");
  return {
    campaign_id: campaignId,
    location_id: optionalString(formData, "location_id"),
    faction_id: optionalString(formData, "faction_id"),
    title: String(formData.get("title") ?? "").trim(),
    description: optionalRichText(formData, "description"),
    status: ["idea", "active", "completed", "failed"].includes(status) ? status : "idea",
    public_notes: optionalRichText(formData, "public_notes"),
    dm_notes: optionalRichText(formData, "dm_notes"),
  };
}

export async function createQuest(campaignId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.title) throw new Error("Il titolo della quest è obbligatorio.");

  const supabase = await createClient();
  const { data, error } = await supabase.from("quests").insert(fields).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Errore nella creazione della quest.");

  revalidatePath(`/campaigns/${campaignId}/quests`);
  redirect(withFlash(`/campaigns/${campaignId}/quests`, "Quest creata."));
}

export async function updateQuest(campaignId: string, questId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.title) throw new Error("Il titolo della quest è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("quests").update(fields).eq("id", questId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/quests`);
  redirect(withFlash(`/campaigns/${campaignId}/quests`, "Quest salvata."));
}

// ---------------------------------------------------------------------------
// Elementi collegati (NPC/personaggi/fazioni/oggetti)
// ---------------------------------------------------------------------------

export async function syncQuestLinks(campaignId: string, questId: string, formData: FormData) {
  const supabase = await createClient();

  await supabase.from("quest_links").delete().eq("quest_id", questId);

  const rows = QUEST_LINKED_ENTITY_TYPES.flatMap((entityType) =>
    formData
      .getAll(`link_${entityType}`)
      .map(String)
      .filter(Boolean)
      .map((entityId) => ({
        quest_id: questId,
        campaign_id: campaignId,
        entity_type: entityType,
        entity_id: entityId,
      })),
  );

  if (rows.length > 0) {
    const { error } = await supabase.from("quest_links").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/campaigns/${campaignId}/quests/${questId}`);
}

/** Elementi collegati a una quest, usati per pre-compilare gli "Elementi collegati" di una sessione. */
export async function getQuestLinkedEntities(questId: string): Promise<{
  npc: string[];
  character: string[];
  faction: string[];
  item: string[];
  location: string | null;
}> {
  const supabase = await createClient();

  const [{ data: quest }, { data: links }] = await Promise.all([
    supabase.from("quests").select("location_id, faction_id").eq("id", questId).maybeSingle(),
    supabase.from("quest_links").select("entity_type, entity_id").eq("quest_id", questId),
  ]);

  const byType = (type: QuestLinkEntityType) =>
    (links ?? []).filter((l) => l.entity_type === type).map((l) => l.entity_id as string);

  const factionIds = new Set(byType("faction"));
  if (quest?.faction_id) factionIds.add(quest.faction_id);

  return {
    npc: byType("npc"),
    character: byType("character"),
    faction: [...factionIds],
    item: byType("item"),
    location: quest?.location_id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Generazione AI della missione (durante la creazione/modifica, prima di salvare)
// ---------------------------------------------------------------------------

const WRITE_QUEST_TOOL: AiTool = {
  name: "write_quest",
  description: "Scrivi il contenuto completo di una missione (quest) per una campagna di gioco di ruolo.",
  parameters: {
    type: "object",
    properties: {
      hook: {
        type: "string",
        description:
          "Descrizione narrativa della missione: come viene presentata ai giocatori, contesto e posta in gioco. 2-3 brevi paragrafi.",
      },
      objectives: {
        type: "string",
        description:
          "Obiettivi/passi concreti che i giocatori devono affrontare, così come li conoscerebbero loro. Una voce per riga.",
      },
      secrets: {
        type: "string",
        description:
          "Informazioni segrete solo per il DM: vera motivazione dietro la missione, colpi di scena, complicazioni, eventuali doppi giochi. Una voce per riga o brevi paragrafi.",
      },
      rewards: {
        type: "string",
        description: "Ricompense proposte per la missione: oro, oggetti, favori, reputazione. Una voce per riga.",
      },
    },
    required: ["hook", "objectives"],
  },
};

export async function generateQuestContent(
  campaignId: string,
  input: { title: string; description: string; locationId: string; npcIds: string[] },
): Promise<{ description?: string; publicNotes?: string; dmNotes?: string; error?: string }> {
  const supabase = await createClient();

  const [{ data: settings }, { data: location }, { data: npcs }] = await Promise.all([
    supabase.from("user_settings").select("ai_provider").maybeSingle(),
    input.locationId
      ? supabase
          .from("locations")
          .select("name, type, description")
          .eq("id", input.locationId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    input.npcIds.length
      ? supabase.from("npcs").select("name, role, description").in("id", input.npcIds)
      : Promise.resolve({ data: [] }),
  ]);

  const contextLines = [
    location
      ? `Luogo: ${location.name}${location.type ? ` (${location.type})` : ""}${
          stripHtml(location.description) ? ` — ${stripHtml(location.description)}` : ""
        }`
      : null,
    (npcs ?? []).length
      ? `NPC coinvolti:\n${(npcs ?? [])
          .map(
            (n) =>
              `- ${n.name}${n.role ? ` (${n.role})` : ""}${
                stripHtml(n.description) ? `: ${stripHtml(n.description)}` : ""
              }`,
          )
          .join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const systemPrompt = [
    "Sei l'assistente del Dungeon Master. Il DM sta creando una nuova missione (quest) per la sua campagna e ti chiede di generarne il contenuto completo, non solo di riformulare un testo: obiettivi concreti, segreti per il DM ed eventuali ricompense, usando lo strumento write_quest.",
    contextLines ? `Contesto già noto della campagna:\n${contextLines}` : null,
    "Sii concreto e specifico, coerente col contesto fornito. Non inventare dettagli platealmente in conflitto con quanto fornito. Rispondi sempre in italiano.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const userMessage = [
    `Titolo della missione: "${input.title.trim() || "(senza titolo ancora, proponi tu il contenuto)"}"`,
    stripHtml(input.description)
      ? `Accenno già scritto dal DM, da usare come punto di partenza:\n${stripHtml(input.description)}`
      : "Il DM non ha ancora scritto nulla: genera tu una missione plausibile e interessante.",
  ].join("\n\n");

  try {
    const provider: AiProvider = (settings?.ai_provider as AiProvider) ?? "gemini";
    const result = await askAssistant(
      provider,
      systemPrompt,
      [{ role: "user", text: userMessage }],
      [WRITE_QUEST_TOOL],
      WRITE_QUEST_TOOL.name,
    );
    if (result.type !== "tool_call") {
      return { error: "L'assistente non ha generato una missione strutturata, riprova." };
    }

    const hook = typeof result.input.hook === "string" ? result.input.hook : "";
    const objectives = typeof result.input.objectives === "string" ? result.input.objectives : "";
    const secrets = typeof result.input.secrets === "string" ? result.input.secrets : "";
    const rewards = typeof result.input.rewards === "string" ? result.input.rewards : "";

    if (!hook && !objectives) {
      return { error: "L'assistente non ha restituito contenuto utilizzabile, riprova." };
    }

    const publicNotesParts = objectives ? `<p><strong>Obiettivi</strong></p>${linesToHtmlList(objectives)}` : "";
    const dmNotesParts = [
      secrets ? `<p><strong>Segreti</strong></p>${linesToHtmlList(secrets)}` : "",
      rewards ? `<p><strong>Ricompense</strong></p>${linesToHtmlList(rewards)}` : "",
    ].join("");

    return {
      description: hook ? textToHtml(hook) : undefined,
      publicNotes: publicNotesParts || undefined,
      dmNotes: dmNotesParts || undefined,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Errore imprevisto nella chiamata all'assistente AI.",
    };
  }
}

export async function deleteQuest(campaignId: string, questId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quests").delete().eq("id", questId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/quests`);
  redirect(withFlash(`/campaigns/${campaignId}/quests`, "Quest eliminata."));
}
