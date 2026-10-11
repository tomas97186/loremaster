import { createClient } from "@/lib/db/client";
import type { AiProvider } from "@/lib/db/types";
import { normalizeClaudeModel } from "./claude-models";

export type AiKeyColumn = "gemini_api_key" | "anthropic_api_key";

const COLUMN: Record<AiProvider, AiKeyColumn> = {
  gemini: "gemini_api_key",
  claude: "anthropic_api_key",
};

const ENV_VAR: Record<AiProvider, string> = {
  gemini: "GEMINI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
};

/** Modello Claude scelto in Impostazioni (o il predefinito). */
export async function resolveClaudeModel(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.from("user_settings").select("claude_model").maybeSingle();
  return normalizeClaudeModel((data as { claude_model: string | null } | null)?.claude_model);
}

/** Chiave salvata dall'utente in Impostazioni, altrimenti variabile d'ambiente. */
export async function resolveAiKey(provider: AiProvider): Promise<string | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from("user_settings").select(COLUMN[provider]).maybeSingle();
  const saved = (data as Record<string, string | null> | null)?.[COLUMN[provider]];
  return saved?.trim() || process.env[ENV_VAR[provider]] || undefined;
}
