// Helper condivisi (server + client) per i campi rich text con citazioni.
// Il contenuto viene salvato come HTML prodotto da uno schema Tiptap ristretto
// (vedi components/rich-text/extensions.ts) dentro le stesse colonne `text`
// già esistenti: nessuna migrazione dello schema è necessaria.

export type MentionableType =
  | "npc"
  | "location"
  | "faction"
  | "quest"
  | "character"
  | "item";

export interface MentionableEntity {
  id: string;
  name: string;
  type: MentionableType;
}

export const ENTITY_TYPE_PATH: Record<MentionableType, string> = {
  npc: "npcs",
  location: "locations",
  faction: "factions",
  quest: "quests",
  character: "characters",
  item: "items",
};

export const ENTITY_TYPE_LABELS: Record<MentionableType, string> = {
  npc: "NPC",
  location: "Luogo",
  faction: "Fazione",
  quest: "Quest",
  character: "Personaggio",
  item: "Oggetto",
};

export function mentionHref(campaignId: string, type: MentionableType, id: string) {
  return `/campaigns/${campaignId}/${ENTITY_TYPE_PATH[type]}/${id}`;
}

/** True se l'HTML di un editor Tiptap non contiene testo visibile (es. "<p></p>"). */
export function isEmptyHtml(html: string | null | undefined): boolean {
  if (!html) return true;
  return stripHtml(html) === null;
}

/** Testo semplice da un HTML rich text, per anteprime o prompt (non per la resa visiva). */
export function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length ? text : null;
}

/** Testo semplice troncato, per anteprime al passaggio del mouse o in liste. */
export function previewText(html: string | null | undefined, maxLen = 220): string | null {
  const text = stripHtml(html);
  if (!text) return null;
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Testo semplice (es. generato da un LLM) in HTML compatibile col nostro editor: un <p> per paragrafo. */
export function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Testo con una voce per riga (es. generato da un LLM) in un elenco puntato HTML. */
export function linesToHtmlList(text: string): string {
  const items = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
  if (items.length === 0) return "";
  if (items.length === 1) return textToHtml(items[0]);
  return `<ul>${items.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join("")}</ul>`;
}
