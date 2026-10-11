"use server";

import { createClient } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { resolveProvider } from "@/lib/ai/provider-options";
import { askAssistant, type AiMessage, type AiTool } from "@/lib/ai/gateway";
import type { AiProvider, SessionLinkEntityType } from "@/lib/db/types";
import { isEmptyHtml, stripHtml, textToHtml } from "@/lib/richtext";
import { withFlash } from "@/lib/utils";
import { extractSessionSections, sectionsToHtml, type SessionSections } from "@/lib/session-import";

function optionalRichText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "");
  return isEmptyHtml(value) ? null : value;
}

const LINKED_ENTITY_TYPES: SessionLinkEntityType[] = [
  "npc",
  "location",
  "quest",
  "character",
  "faction",
  "item",
];

// ---------------------------------------------------------------------------
// Sessione
// ---------------------------------------------------------------------------

export async function createSession(campaignId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Il titolo della sessione è obbligatorio.");

  const scheduledAtRaw = String(formData.get("scheduled_at") ?? "").trim();
  const sessionNumberRaw = String(formData.get("session_number") ?? "").trim();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      campaign_id: campaignId,
      title,
      scheduled_at: scheduledAtRaw ? new Date(scheduledAtRaw).toISOString() : null,
      session_number: sessionNumberRaw ? Number(sessionNumberRaw) : null,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Errore nella creazione della sessione.");

  revalidatePath(`/campaigns/${campaignId}/sessions`);
  redirect(withFlash(`/campaigns/${campaignId}/sessions/${data.id}`, "Sessione creata."));
}

const POLISH_SESSION_TOOL: AiTool = {
  name: "polish_session_text",
  description:
    "Correggi refusi ed errori grammaticali nel testo di una sessione di gioco di ruolo, migliorandone la scorrevolezza.",
  parameters: {
    type: "object",
    properties: {
      prepNotes: {
        type: "string",
        description:
          "Testo delle note di preparazione corretto e rifinito, con la stessa struttura in paragrafi dell'originale.",
      },
      summary: {
        type: "string",
        description:
          "Testo del resoconto (cosa è successo durante la sessione) corretto e rifinito, con la stessa struttura in paragrafi dell'originale.",
      },
    },
    required: ["prepNotes", "summary"],
  },
};

async function polishSessionSection(
  provider: AiProvider,
  section: SessionSections,
): Promise<SessionSections> {
  if (!section.prepText && !section.summaryText) return section;

  const userMessage = [
    section.prepText ? `Note di preparazione:\n${section.prepText}` : "Nessuna nota di preparazione.",
    section.summaryText ? `Resoconto:\n${section.summaryText}` : "Nessun resoconto.",
  ].join("\n\n");

  try {
    const result = await askAssistant(
      provider,
      "Sei un editor che corregge refusi e piccoli errori grammaticali in testi di sessioni di gioco di ruolo (D&D), in italiano. Migliora solo la forma: non alterare fatti, nomi propri, numeri o eventi narrati, non aggiungere né togliere contenuto, mantieni la stessa suddivisione in paragrafi. Usa lo strumento polish_session_text.",
      [{ role: "user", text: userMessage }],
      [POLISH_SESSION_TOOL],
      POLISH_SESSION_TOOL.name,
    );
    if (result.type !== "tool_call") return section;

    const prepNotes = typeof result.input.prepNotes === "string" ? result.input.prepNotes : null;
    const summary = typeof result.input.summary === "string" ? result.input.summary : null;
    return {
      ...section,
      prepText: section.prepText ? prepNotes || section.prepText : null,
      summaryText: section.summaryText ? summary || section.summaryText : null,
    };
  } catch {
    // Meglio importare il testo grezzo che perdere l'intera sessione per un errore dell'AI.
    return section;
  }
}

export async function importSessions(campaignId: string, formData: FormData) {
  const raw = String(formData.get("raw_text") ?? "");
  const shouldPolish = formData.get("polish") === "on";
  const sections = extractSessionSections(raw);
  if (sections.length === 0) {
    throw new Error(
      "Non ho trovato nessuna sessione nel testo incollato: deve contenere intestazioni \"Introduzione N\".",
    );
  }

  const supabase = await createClient();

  let finalSections = sections;
  if (shouldPolish) {
    const { data: settings } = await supabase.from("user_settings").select("ai_provider").maybeSingle();
    const provider: AiProvider = (settings?.ai_provider as AiProvider) ?? "gemini";
    finalSections = await Promise.all(sections.map((s) => polishSessionSection(provider, s)));
  }

  const rows = finalSections.map((section) => {
    const { prepNotes, summary } = sectionsToHtml(section);
    return {
      campaign_id: campaignId,
      title: section.title,
      session_number: section.sessionNumber,
      status: "completed" as const,
      xp_awarded: section.xpAwarded,
      prep_notes: prepNotes,
      summary,
    };
  });

  const { error } = await supabase.from("sessions").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/sessions`);
  redirect(
    withFlash(
      `/campaigns/${campaignId}/sessions`,
      `${rows.length} session${rows.length === 1 ? "e" : "i"} importat${rows.length === 1 ? "a" : "e"}. Ricontrollale prima di fidartene del tutto.`,
    ),
  );
}

export async function updateSessionDetails(
  campaignId: string,
  sessionId: string,
  formData: FormData,
) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Il titolo della sessione è obbligatorio.");

  const scheduledAtRaw = String(formData.get("scheduled_at") ?? "").trim();
  const sessionNumberRaw = String(formData.get("session_number") ?? "").trim();
  const status = String(formData.get("status") ?? "planned");

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({
      title,
      scheduled_at: scheduledAtRaw ? new Date(scheduledAtRaw).toISOString() : null,
      session_number: sessionNumberRaw ? Number(sessionNumberRaw) : null,
      status: ["planned", "completed", "skipped"].includes(status) ? status : "planned",
    })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

export async function updateSessionPrep(
  campaignId: string,
  sessionId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ prep_notes: optionalRichText(formData, "prep_notes") })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

// ---------------------------------------------------------------------------
// Generazione AI della preparazione (note, punti chiave, combattimenti)
// ---------------------------------------------------------------------------

const WRITE_SESSION_PREP_TOOL: AiTool = {
  name: "write_session_prep",
  description:
    "Genera i contenuti di preparazione per una sessione di gioco di ruolo: note di preparazione, punti chiave da ricordare e combattimenti pianificati.",
  parameters: {
    type: "object",
    properties: {
      prepNotes: {
        type: "string",
        description:
          "Note di preparazione narrative per il DM: scaletta della sessione, agganci narrativi, come potrebbe iniziare e svilupparsi. Alcuni brevi paragrafi.",
      },
      keyPoints: {
        type: "array",
        description:
          "Punti chiave/promemoria concreti da non dimenticare durante la sessione, ciascuno una frase breve e autonoma.",
        items: { type: "string" },
      },
      encounters: {
        type: "array",
        description:
          "Combattimenti pianificati per la sessione, se pertinenti al contesto. Lascia vuoto se non ce ne sono.",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nome breve del combattimento." },
            enemies: { type: "string", description: "Nemici coinvolti, con breve descrizione." },
            rewards: { type: "string", description: "Eventuale bottino/ricompense." },
            xp: { type: "number", description: "Punti esperienza totali stimati." },
          },
          required: ["name"],
        },
      },
    },
    required: ["prepNotes"],
  },
};

function formatLinkedEntity(name: string, description: string | null) {
  const desc = stripHtml(description);
  return desc ? `${name}: ${desc}` : name;
}

export async function generateSessionPrep(
  campaignId: string,
  sessionId: string,
  prompt: string,
): Promise<{ prepNotes?: string; error?: string }> {
  const supabase = await createClient();

  const [{ data: session }, { data: settings }, { data: links }, { data: recentSessions }] = await Promise.all([
    supabase.from("sessions").select("title, prep_notes").eq("id", sessionId).single(),
    supabase.from("user_settings").select("ai_provider").maybeSingle(),
    supabase
      .from("session_links")
      .select("entity_type, entity_id")
      .eq("session_id", sessionId),
    supabase
      .from("sessions")
      .select("title, session_number, summary")
      .eq("campaign_id", campaignId)
      .neq("id", sessionId)
      .order("session_number", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (!session) return { error: "Sessione non trovata." };

  const previousSummaryLines = (recentSessions ?? [])
    .map((s) => {
      const summary = stripHtml(s.summary);
      if (!summary) return null;
      return `- ${s.session_number ? `#${s.session_number} ` : ""}${s.title}: ${summary}`;
    })
    .filter((line): line is string => Boolean(line))
    .slice(0, 2);

  const idsByType = new Map<SessionLinkEntityType, string[]>();
  for (const link of links ?? []) {
    const type = link.entity_type as SessionLinkEntityType;
    const ids = idsByType.get(type) ?? [];
    ids.push(link.entity_id);
    idsByType.set(type, ids);
  }
  const npcIds = idsByType.get("npc") ?? [];
  const locationIds = idsByType.get("location") ?? [];
  const questIds = idsByType.get("quest") ?? [];
  const characterIds = idsByType.get("character") ?? [];
  const factionIds = idsByType.get("faction") ?? [];
  const itemIds = idsByType.get("item") ?? [];

  const [{ data: npcs }, { data: locations }, { data: quests }, { data: characters }, { data: factions }, { data: items }] =
    await Promise.all([
      npcIds.length
        ? supabase.from("npcs").select("name, description").in("id", npcIds)
        : Promise.resolve({ data: [] }),
      locationIds.length
        ? supabase.from("locations").select("name, description").in("id", locationIds)
        : Promise.resolve({ data: [] }),
      questIds.length
        ? supabase.from("quests").select("title, description").in("id", questIds)
        : Promise.resolve({ data: [] }),
      characterIds.length
        ? supabase.from("characters").select("name, description").in("id", characterIds)
        : Promise.resolve({ data: [] }),
      factionIds.length
        ? supabase.from("factions").select("name, description").in("id", factionIds)
        : Promise.resolve({ data: [] }),
      itemIds.length
        ? supabase.from("items").select("name, description").in("id", itemIds)
        : Promise.resolve({ data: [] }),
    ]);

  const contextLines = [
    (npcs ?? []).length
      ? `NPC collegati:\n${(npcs ?? []).map((n) => `- ${formatLinkedEntity(n.name, n.description)}`).join("\n")}`
      : null,
    (locations ?? []).length
      ? `Luoghi collegati:\n${(locations ?? [])
          .map((l) => `- ${formatLinkedEntity(l.name, l.description)}`)
          .join("\n")}`
      : null,
    (quests ?? []).length
      ? `Quest collegate:\n${(quests ?? [])
          .map((q) => `- ${formatLinkedEntity(q.title, q.description)}`)
          .join("\n")}`
      : null,
    (characters ?? []).length
      ? `Personaggi dei giocatori collegati:\n${(characters ?? [])
          .map((c) => `- ${formatLinkedEntity(c.name, c.description)}`)
          .join("\n")}`
      : null,
    (factions ?? []).length
      ? `Fazioni collegate:\n${(factions ?? [])
          .map((f) => `- ${formatLinkedEntity(f.name, f.description)}`)
          .join("\n")}`
      : null,
    (items ?? []).length
      ? `Oggetti collegati:\n${(items ?? []).map((i) => `- ${formatLinkedEntity(i.name, i.description)}`).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const systemPrompt = [
    "Sei l'assistente del Dungeon Master. Il DM sta preparando una sessione di gioco di ruolo e ti chiede di generarne i contenuti usando lo strumento write_session_prep: note di preparazione, punti chiave da ricordare, ed eventuali combattimenti.",
    previousSummaryLines.length
      ? `Resoconto delle sessioni precedenti (dalla più recente): la nuova sessione deve proseguire da qui, in continuità con quanto accaduto.\n${previousSummaryLines.join("\n")}`
      : null,
    contextLines ? `Elementi già collegati a questa sessione:\n${contextLines}` : null,
    "Sii concreto e specifico, coerente col contesto fornito. Non inventare dettagli platealmente in conflitto con quanto fornito. Rispondi sempre in italiano.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const userMessage = [
    `Sessione: "${session.title}"`,
    stripHtml(session.prep_notes)
      ? `Note di preparazione già scritte, da usare come punto di partenza:\n${stripHtml(session.prep_notes)}`
      : null,
    prompt.trim()
      ? `Indicazioni del DM per questa sessione:\n${prompt.trim()}`
      : "Il DM non ha scritto indicazioni specifiche: proponi tu una preparazione plausibile e interessante in base al contesto.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const provider: AiProvider = (settings?.ai_provider as AiProvider) ?? "gemini";
    const result = await askAssistant(
      provider,
      systemPrompt,
      [{ role: "user", text: userMessage }],
      [WRITE_SESSION_PREP_TOOL],
      WRITE_SESSION_PREP_TOOL.name,
    );
    if (result.type !== "tool_call") {
      return { error: "L'assistente non ha generato una preparazione strutturata, riprova." };
    }

    const prepNotesRaw = typeof result.input.prepNotes === "string" ? result.input.prepNotes : "";
    if (!prepNotesRaw.trim()) {
      return { error: "L'assistente non ha restituito contenuto utilizzabile, riprova." };
    }

    const keyPoints = Array.isArray(result.input.keyPoints)
      ? result.input.keyPoints.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      : [];

    const encountersRaw = Array.isArray(result.input.encounters) ? result.input.encounters : [];
    const encounters = encountersRaw
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map((e) => ({
        name: typeof e.name === "string" ? e.name : "",
        enemies: typeof e.enemies === "string" ? e.enemies : "",
        rewards: typeof e.rewards === "string" ? e.rewards : "",
        xp: typeof e.xp === "number" ? e.xp : null,
      }))
      .filter((e) => e.name.trim().length > 0);

    if (keyPoints.length > 0) {
      const { count } = await supabase
        .from("session_key_points")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId);
      const startPosition = count ?? 0;
      const { error: keyPointsError } = await supabase.from("session_key_points").insert(
        keyPoints.map((content, i) => ({
          session_id: sessionId,
          content,
          position: startPosition + i,
        })),
      );
      if (keyPointsError) throw new Error(keyPointsError.message);
    }

    if (encounters.length > 0) {
      const { count } = await supabase
        .from("encounters")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId);
      const startPosition = count ?? 0;
      const { error: encountersError } = await supabase.from("encounters").insert(
        encounters.map((e, i) => ({
          session_id: sessionId,
          campaign_id: campaignId,
          name: e.name,
          enemies: e.enemies ? textToHtml(e.enemies) : null,
          rewards: e.rewards ? textToHtml(e.rewards) : null,
          xp: e.xp,
          position: startPosition + i,
        })),
      );
      if (encountersError) throw new Error(encountersError.message);
    }

    revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);

    return { prepNotes: textToHtml(prepNotesRaw) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Errore imprevisto nella chiamata all'assistente AI.",
    };
  }
}

export async function updateSessionSummary(
  campaignId: string,
  sessionId: string,
  formData: FormData,
) {
  const xpRaw = String(formData.get("xp_awarded") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({
      summary: optionalRichText(formData, "summary"),
      xp_awarded: xpRaw ? Number(xpRaw) : null,
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);

  // Con un resoconto scritto la sessione è stata giocata: da "pianificata" passa a "completata".
  if (!isEmptyHtml(String(formData.get("summary") ?? ""))) {
    const { error: statusError } = await supabase
      .from("sessions")
      .update({ status: "completed" })
      .eq("id", sessionId)
      .eq("status", "planned");
    if (statusError) throw new Error(statusError.message);
  }

  revalidatePath(`/campaigns/${campaignId}/sessions`);
  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

export async function deleteSession(campaignId: string, sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/sessions`);
  redirect(withFlash(`/campaigns/${campaignId}/sessions`, "Sessione eliminata."));
}

// ---------------------------------------------------------------------------
// Note rapide
// ---------------------------------------------------------------------------

export async function addSessionNote(
  campaignId: string,
  sessionId: string,
  formData: FormData,
) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("session_notes")
    .insert({ session_id: sessionId, content });
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

export async function deleteSessionNote(
  campaignId: string,
  sessionId: string,
  noteId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("session_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

// ---------------------------------------------------------------------------
// Punti chiave
// ---------------------------------------------------------------------------

export async function addSessionKeyPoint(
  campaignId: string,
  sessionId: string,
  formData: FormData,
) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("session_key_points")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const { error } = await supabase
    .from("session_key_points")
    .insert({ session_id: sessionId, content, position: count ?? 0 });
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

export async function toggleSessionKeyPoint(
  campaignId: string,
  sessionId: string,
  keyPointId: string,
  done: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("session_key_points")
    .update({ done })
    .eq("id", keyPointId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

export async function deleteSessionKeyPoint(
  campaignId: string,
  sessionId: string,
  keyPointId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("session_key_points").delete().eq("id", keyPointId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

// ---------------------------------------------------------------------------
// Elementi collegati (NPC/luoghi/quest/personaggi/fazioni/oggetti)
// ---------------------------------------------------------------------------

export async function syncSessionLinks(
  campaignId: string,
  sessionId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  await supabase.from("session_links").delete().eq("session_id", sessionId);

  const rows = LINKED_ENTITY_TYPES.flatMap((entityType) =>
    formData
      .getAll(`link_${entityType}`)
      .map(String)
      .filter(Boolean)
      .map((entityId) => ({
        session_id: sessionId,
        campaign_id: campaignId,
        entity_type: entityType,
        entity_id: entityId,
      })),
  );

  if (rows.length > 0) {
    const { error } = await supabase.from("session_links").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

// ---------------------------------------------------------------------------
// Assistente AI
// ---------------------------------------------------------------------------

const TABLE_FOR: Record<SessionLinkEntityType, string> = {
  npc: "npcs",
  location: "locations",
  quest: "quests",
  character: "characters",
  faction: "factions",
  item: "items",
};

const NAME_FIELD_FOR: Record<SessionLinkEntityType, string> = {
  npc: "name",
  location: "name",
  quest: "title",
  character: "name",
  faction: "name",
  item: "name",
};

const LABEL_FOR: Record<SessionLinkEntityType, string> = {
  npc: "NPC coinvolti",
  location: "Luoghi coinvolti",
  quest: "Quest coinvolte",
  character: "Personaggi coinvolti",
  faction: "Fazioni coinvolte",
  item: "Oggetti coinvolti",
};

export async function askSessionAssistant(
  campaignId: string,
  sessionId: string,
  messages: AiMessage[],
  providerOverride?: AiProvider,
): Promise<{ answer?: string; error?: string }> {
  const supabase = await createClient();

  const [
    { data: campaign },
    { data: session },
    { data: settings },
    { data: links },
    { data: recentSessions },
    { data: encounters },
  ] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", campaignId).single(),
      supabase.from("sessions").select("*").eq("id", sessionId).single(),
      supabase.from("user_settings").select("ai_provider").maybeSingle(),
      supabase
        .from("session_links")
        .select("entity_type, entity_id")
        .eq("session_id", sessionId),
      supabase
        .from("sessions")
        .select("title, session_number, summary")
        .eq("campaign_id", campaignId)
        .neq("id", sessionId)
        .order("session_number", { ascending: false, nullsFirst: false })
        .limit(3),
      supabase
        .from("encounters")
        .select("name, enemies, rewards, xp, completed")
        .eq("session_id", sessionId)
        .order("position"),
    ]);

  if (!campaign || !session) {
    return { error: "Campagna o sessione non trovata." };
  }

  const linkedByType = new Map<string, string[]>();
  for (const link of links ?? []) {
    const ids = linkedByType.get(link.entity_type) ?? [];
    ids.push(link.entity_id);
    linkedByType.set(link.entity_type, ids);
  }

  const namesFor = async (entityType: SessionLinkEntityType) => {
    const ids = linkedByType.get(entityType) ?? [];
    if (ids.length === 0) return [];
    const nameField = NAME_FIELD_FOR[entityType];
    const { data } = await supabase
      .from(TABLE_FOR[entityType])
      .select(nameField)
      .in("id", ids);
    return (data ?? []).map((row) => (row as unknown as Record<string, string>)[nameField]);
  };

  const namesByType = await Promise.all(LINKED_ENTITY_TYPES.map((type) => namesFor(type)));

  const linkedLines = LINKED_ENTITY_TYPES.map((type, i) => {
    const names = namesByType[i];
    return names.length ? `${LABEL_FOR[type]}: ${names.join(", ")}.` : null;
  }).filter(Boolean);

  const previousSessionsLines = (recentSessions ?? [])
    .map((s) => {
      const summary = stripHtml(s.summary);
      if (!summary) return null;
      const number = s.session_number ? `#${s.session_number} ` : "";
      return `- ${number}${s.title}: ${summary}`;
    })
    .filter((line): line is string => Boolean(line));

  const encounterLines = (encounters ?? []).map((e, i) => {
    const name = e.name || `Combattimento ${i + 1}`;
    const status = e.completed ? "fatto" : "da fare";
    const enemies = stripHtml(e.enemies);
    const rewards = stripHtml(e.rewards);
    return [
      `- ${name} [${status}]`,
      enemies ? `  nemici: ${enemies}` : null,
      rewards ? `  premi: ${rewards}` : null,
      e.xp ? `  PE: ${e.xp}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const systemPrompt = [
    `Sei l'assistente del Dungeon Master per la campagna "${campaign.name}"` +
      (campaign.system ? ` (${campaign.system})` : "") +
      (campaign.setting ? `, ambientata in: ${campaign.setting}.` : "."),
    stripHtml(campaign.description) ? `Descrizione campagna: ${stripHtml(campaign.description)}` : null,
    `Sessione corrente: "${session.title}".`,
    previousSessionsLines.length
      ? `Riassunto delle sessioni precedenti:\n${previousSessionsLines.join("\n")}`
      : null,
    stripHtml(session.prep_notes) ? `Note di preparazione scritte finora:\n${stripHtml(session.prep_notes)}` : null,
    encounterLines.length ? `Combattimenti pianificati:\n${encounterLines.join("\n")}` : null,
    ...linkedLines,
    "Rispondi sempre in italiano, in modo conciso e utile per un DM al tavolo durante o prima di una sessione. Usa la formattazione Markdown (elenchi puntati, grassetto, titoli) quando aiuta la leggibilità. Se ci sono già note di preparazione o combattimenti pianificati, tienine conto e costruisci su quelli invece di ripartire da zero. Se non conosci un dettaglio non affermarlo con certezza: proponilo chiaramente come suggerimento o idea, non come fatto stabilito della campagna.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const provider = resolveProvider(providerOverride, settings?.ai_provider);
    const result = await askAssistant(provider, systemPrompt, messages);
    const answer = result.type === "text" ? result.text : "";

    // Salva lo scambio solo a risposta ottenuta, così la cronologia resta coerente.
    const lastUser = messages[messages.length - 1];
    if (lastUser?.role === "user") {
      await supabase.from("session_ai_messages").insert([
        { session_id: sessionId, role: "user", content: lastUser.text, created_at: new Date().toISOString() },
        {
          session_id: sessionId,
          role: "assistant",
          content: answer,
          created_at: new Date(Date.now() + 1).toISOString(),
        },
      ]);
    }
    return { answer };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Errore imprevisto nella chiamata all'assistente AI.",
    };
  }
}

export async function clearSessionAssistantChat(campaignId: string, sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("session_ai_messages").delete().eq("session_id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

export async function generateSessionSummary(
  campaignId: string,
  sessionId: string,
): Promise<{ html?: string; error?: string }> {
  const supabase = await createClient();

  const [{ data: session }, { data: settings }, { data: notes }, { data: encounters }] =
    await Promise.all([
      supabase.from("sessions").select("title, prep_notes").eq("id", sessionId).single(),
      supabase.from("user_settings").select("ai_provider").maybeSingle(),
      supabase
        .from("session_notes")
        .select("content, created_at")
        .eq("session_id", sessionId)
        .order("created_at"),
      supabase
        .from("encounters")
        .select("name, completed, xp")
        .eq("session_id", sessionId)
        .order("position"),
    ]);

  if (!session) return { error: "Sessione non trovata." };

  const noteLines = (notes ?? []).map((n) => `- ${n.content}`);
  const encounterLines = (encounters ?? []).map(
    (e, i) =>
      `- ${e.name || `Combattimento ${i + 1}`}: ${e.completed ? "affrontato" : "non affrontato"}${
        e.xp ? ` (${e.xp} PE)` : ""
      }`,
  );

  const systemPrompt = [
    "Sei l'assistente del Dungeon Master. Scrivi il riepilogo narrativo di quello che è successo durante questa sessione di gioco di ruolo, in italiano, in 2-4 brevi paragrafi.",
    "Basati sulle note rapide prese durante il gioco (in ordine cronologico) e sui combattimenti affrontati: sono la fonte più affidabile di cosa è realmente accaduto. Usa le note di preparazione solo come contesto di sfondo, non come fatti avvenuti per certo.",
    "Rispondi SOLO con il testo del riepilogo, senza titoli, intestazioni o commenti aggiuntivi.",
  ].join("\n\n");

  const userMessage = [
    `Sessione: "${session.title}"`,
    stripHtml(session.prep_notes) ? `Note di preparazione:\n${stripHtml(session.prep_notes)}` : null,
    encounterLines.length ? `Combattimenti:\n${encounterLines.join("\n")}` : null,
    noteLines.length
      ? `Note rapide prese durante la sessione:\n${noteLines.join("\n")}`
      : "Non sono state prese note rapide durante la sessione: basati su preparazione e combattimenti.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const provider: AiProvider = (settings?.ai_provider as AiProvider) ?? "gemini";
    const result = await askAssistant(provider, systemPrompt, [{ role: "user", text: userMessage }]);
    if (result.type !== "text" || !result.text.trim()) {
      return { error: "L'assistente non ha restituito un riepilogo utilizzabile." };
    }
    return { html: textToHtml(result.text) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Errore imprevisto nella chiamata all'assistente AI.",
    };
  }
}
