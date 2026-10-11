"use server";

import { createClient } from "@/lib/db/client";
import { resolveProvider } from "@/lib/ai/provider-options";
import { askAssistant, type AiMessage } from "@/lib/ai/gateway";
import { buildCampaignContext } from "@/lib/ai/context";
import { CAMPAIGN_ASSISTANT_TOOLS } from "@/lib/ai/tools";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { AiProvider } from "@/lib/db/types";
import type { MentionableEntity, MentionableType } from "@/lib/richtext";

export type DraftEntityType = "npc" | "location" | "faction" | "quest" | "item" | "character";

export interface DraftProposal {
  entityType: DraftEntityType;
  label: string;
  fields: Record<string, string>;
  hints: string[];
}

export interface AskCampaignAssistantResult {
  answer?: string;
  draft?: DraftProposal;
  error?: string;
}

function resolveRef(
  mentionable: MentionableEntity[],
  type: MentionableType,
  name: unknown,
  hints: string[],
  hintLabel: string,
): string {
  if (typeof name !== "string" || !name.trim()) return "";
  const match = mentionable.find(
    (e) => e.type === type && e.name.toLowerCase() === name.trim().toLowerCase(),
  );
  if (!match) {
    hints.push(`${hintLabel} "${name}" non trovato/a: selezionalo manualmente, se esiste.`);
    return "";
  }
  return match.id;
}

function str(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  return typeof value === "string" ? value : "";
}

function buildDraft(
  toolName: string,
  input: Record<string, unknown>,
  mentionable: MentionableEntity[],
): DraftProposal | null {
  const hints: string[] = [];

  switch (toolName) {
    case "propose_npc":
      return {
        entityType: "npc",
        label: str(input, "name") || "Nuovo NPC",
        fields: {
          name: str(input, "name"),
          role: str(input, "role"),
          description: str(input, "description"),
          location_id: resolveRef(mentionable, "location", input.location_name, hints, "Il luogo"),
          faction_id: resolveRef(mentionable, "faction", input.faction_name, hints, "La fazione"),
        },
        hints,
      };
    case "propose_location":
      return {
        entityType: "location",
        label: str(input, "name") || "Nuovo luogo",
        fields: {
          name: str(input, "name"),
          type: str(input, "type"),
          description: str(input, "description"),
          parent_id: resolveRef(mentionable, "location", input.parent_name, hints, "Il luogo genitore"),
        },
        hints,
      };
    case "propose_faction":
      return {
        entityType: "faction",
        label: str(input, "name") || "Nuova fazione",
        fields: {
          name: str(input, "name"),
          description: str(input, "description"),
          goals: str(input, "goals"),
        },
        hints,
      };
    case "propose_quest":
      return {
        entityType: "quest",
        label: str(input, "title") || "Nuova quest",
        fields: {
          title: str(input, "title"),
          description: str(input, "description"),
          status: str(input, "status") || "idea",
          location_id: resolveRef(mentionable, "location", input.location_name, hints, "Il luogo"),
          faction_id: resolveRef(mentionable, "faction", input.faction_name, hints, "La fazione"),
        },
        hints,
      };
    case "propose_item":
      return {
        entityType: "item",
        label: str(input, "name") || "Nuovo oggetto",
        fields: {
          name: str(input, "name"),
          item_type: str(input, "item_type"),
          rarity: str(input, "rarity"),
          description: str(input, "description"),
          location_id: resolveRef(mentionable, "location", input.location_name, hints, "Il luogo"),
          owner_npc_id: resolveRef(mentionable, "npc", input.owner_npc_name, hints, "Il proprietario"),
        },
        hints,
      };
    case "propose_character":
      return {
        entityType: "character",
        label: str(input, "name") || "Nuovo personaggio",
        fields: {
          name: str(input, "name"),
          player_name: str(input, "player_name"),
          race: str(input, "race"),
          class: str(input, "class"),
          level: typeof input.level === "number" ? String(input.level) : "",
          description: str(input, "description"),
        },
        hints,
      };
    default:
      return null;
  }
}

export async function askCampaignAssistant(
  campaignId: string,
  messages: AiMessage[],
  providerOverride?: AiProvider,
): Promise<AskCampaignAssistantResult> {
  const supabase = await createClient();

  const [{ data: settings }, context, mentionable] = await Promise.all([
    supabase.from("user_settings").select("ai_provider").maybeSingle(),
    buildCampaignContext(supabase, campaignId),
    getMentionableEntities(supabase, campaignId),
  ]);

  const systemPrompt = [
    "Sei l'assistente del Dungeon Master per questa campagna di gioco di ruolo.",
    "Conosci tutti i dati della campagna elencati qui sotto: usali per dare risposte concrete, coerenti e specifiche, non generiche.",
    "Aiuta a preparare sessioni, sviluppare trame, far reagire gli NPC in modo coerente con quello che sai di loro, e proporre nuovi elementi quando richiesto.",
    "Se ti viene chiesto di creare un nuovo NPC, luogo, fazione, quest, oggetto o personaggio, usa lo strumento apposito invece di limitarti a descriverlo a parole.",
    "Se non conosci un dettaglio non affermarlo con certezza: proponilo chiaramente come suggerimento o idea, non come fatto stabilito della campagna.",
    "Rispondi sempre in italiano, in modo conciso e utile per un DM al tavolo. Usa la formattazione Markdown (elenchi puntati, grassetto, titoli) quando aiuta la leggibilità.",
    "",
    context,
  ].join("\n");

  try {
    const provider = resolveProvider(providerOverride, settings?.ai_provider);
    const result = await askAssistant(provider, systemPrompt, messages, CAMPAIGN_ASSISTANT_TOOLS);

    if (result.type === "tool_call") {
      const draft = buildDraft(result.name, result.input, mentionable);
      if (draft) return { draft };
      return { answer: "Non sono riuscito a preparare una bozza valida, riprova specificando meglio." };
    }

    return { answer: result.text };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Errore imprevisto nella chiamata all'assistente AI.",
    };
  }
}
