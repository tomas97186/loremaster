import { escapeHtml } from "./richtext";

export interface SessionSections {
  sessionNumber: number;
  title: string;
  prepText: string | null;
  summaryText: string | null;
  keyPoints: string[];
  xpAwarded: number | null;
}

export interface ParsedSession {
  sessionNumber: number;
  title: string;
  prepNotes: string | null;
  summary: string | null;
  xpAwarded: number | null;
}

const HEADER_RE = /^Introduzione\s+(\d+)(?:-(\d+))?\s*$/;
const SECTION_MARKERS = ["Riassunto", "Punti Chiave", "Punti Esperienza"] as const;

/** Sostituisce i wikilink in stile Obsidian ([[Target]], [[Target|Testo]], [[Target#Ancora|Testo]]) con testo semplice. */
function cleanWikiLinks(text: string): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_match, inner: string) => {
    const parts = inner.split("|").map((s: string) => s.trim());
    if (parts[1]) return parts[1];
    return parts[0].split("#")[0].trim();
  });
}

function normalizeParagraphs(rawText: string): string | null {
  const text = cleanWikiLinks(rawText).trim();
  return text.length ? text : null;
}

/** Converte testo semplice (con eventuale **grassetto**) in paragrafi HTML. */
function paragraphsToHtml(rawText: string): string | null {
  const paragraphs = rawText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;
  return paragraphs
    .map((p) => {
      const escaped = escapeHtml(p).replace(/\n/g, "<br>");
      const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return `<p>${withBold}</p>`;
    })
    .join("");
}

function itemsToHtmlList(items: string[]): string | null {
  if (items.length === 0) return null;
  return `<ul>${items
    .map((item) => {
      const escaped = escapeHtml(item).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return `<li><p>${escaped}</p></li>`;
    })
    .join("")}</ul>`;
}

/**
 * Valuta espressioni semplici tipo "700 + 1350", "2300 x 2", "6 x 200 + 700",
 * "1000 + 1000 + 2300 + 300 = 4200" (in questo caso prende il totale dopo "=").
 * Torna null se non riconosce un'espressione numerica valida.
 */
function evaluateXpExpression(raw: string): number | null {
  const afterEquals = raw.includes("=") ? raw.split("=").pop()! : raw;
  const cleaned = afterEquals.replace(/×/g, "x").trim();
  if (!cleaned || !/^[\d\s+x*]+$/i.test(cleaned)) return null;

  const total = cleaned
    .split("+")
    .map((term) => term.trim())
    .filter(Boolean)
    .reduce((sum, term) => {
      const factors = term.split(/x/i).map((n) => Number(n.trim()));
      if (factors.some((n) => Number.isNaN(n))) return sum;
      return sum + factors.reduce((product, n) => product * n, 1);
    }, 0);

  return total > 0 ? total : null;
}

function splitSections(text: string): Record<string, string> {
  const lines = text.split("\n");
  const result: Record<string, string> = { before: "" };
  let current = "before";
  let buffer: string[] = [];

  const flush = () => {
    result[current] = buffer.join("\n");
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const marker = (SECTION_MARKERS as readonly string[]).find((m) => trimmed === m);
    if (marker) {
      flush();
      current = marker;
    } else {
      buffer.push(line);
    }
  }
  flush();
  return result;
}

/**
 * Divide un testo con più sessioni in blocchi "Introduzione N" (o "Introduzione
 * N-M") e per ciascuno estrae il testo semplice di preparazione, resoconto,
 * punti chiave e punti esperienza. Pensato per note stile Obsidian/Notion con
 * questa struttura ricorrente, ma degrada in modo ragionevole se qualche
 * sezione manca: va sempre rivisto un po' dopo l'importazione.
 */
export function extractSessionSections(raw: string): SessionSections[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  const blocks: { sessionNumber: number; titleSuffix: string; lines: string[] }[] = [];
  for (const line of lines) {
    const match = line.trim().match(HEADER_RE);
    if (match) {
      blocks.push({
        sessionNumber: Number(match[1]),
        titleSuffix: match[2] ? `${match[1]}-${match[2]}` : match[1],
        lines: [],
      });
    } else if (blocks.length > 0) {
      blocks[blocks.length - 1].lines.push(line);
    }
  }

  return blocks.map((block) => {
    const sections = splitSections(block.lines.join("\n"));
    const keyPoints = cleanWikiLinks(sections["Punti Chiave"] ?? "")
      .split("\n")
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);

    return {
      sessionNumber: block.sessionNumber,
      title: `Introduzione ${block.titleSuffix}`,
      prepText: normalizeParagraphs(sections["before"] ?? ""),
      summaryText: normalizeParagraphs(sections["Riassunto"] ?? ""),
      keyPoints,
      xpAwarded: sections["Punti Esperienza"]
        ? evaluateXpExpression(sections["Punti Esperienza"])
        : null,
    };
  });
}

/** Converte le sezioni di una sessione (testo semplice) nei campi HTML pronti per il salvataggio. */
export function sectionsToHtml(section: SessionSections): {
  prepNotes: string | null;
  summary: string | null;
} {
  const prepNotes = section.prepText ? paragraphsToHtml(section.prepText) : null;

  const summaryParts: string[] = [];
  if (section.summaryText) {
    const html = paragraphsToHtml(section.summaryText);
    if (html) summaryParts.push(html);
  }
  const keyPointsHtml = itemsToHtmlList(section.keyPoints);
  if (keyPointsHtml) {
    summaryParts.push("<p><strong>Punti chiave</strong></p>");
    summaryParts.push(keyPointsHtml);
  }

  return { prepNotes, summary: summaryParts.length ? summaryParts.join("") : null };
}

/** Estrae e converte direttamente in HTML, senza passaggi intermedi (es. senza rifinitura AI). */
export function parseSessionsText(raw: string): ParsedSession[] {
  return extractSessionSections(raw).map((section) => ({
    sessionNumber: section.sessionNumber,
    title: section.title,
    ...sectionsToHtml(section),
    xpAwarded: section.xpAwarded,
  }));
}
