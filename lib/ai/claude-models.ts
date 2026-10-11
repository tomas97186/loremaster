export interface ClaudeModelOption {
  id: string;
  label: string;
  /** Prezzo indicativo in $ per milione di token (input / output). */
  price: string;
}

export const CLAUDE_MODELS: ClaudeModelOption[] = [
  { id: "claude-haiku-5-5", label: "Haiku 5.5 — economico (predefinito)", price: "$0,10 / $0,50" },
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5 — bilanciato", price: "$2 / $10" },
  { id: "claude-opus-5-5", label: "Opus 5.5 — più capace", price: "$4 / $20" },
];

export const DEFAULT_CLAUDE_MODEL = "claude-haiku-5-5";

/** Modello valido tra quelli noti, altrimenti il predefinito. */
export function normalizeClaudeModel(id: string | null | undefined): string {
  return CLAUDE_MODELS.some((m) => m.id === id) ? (id as string) : DEFAULT_CLAUDE_MODEL;
}
