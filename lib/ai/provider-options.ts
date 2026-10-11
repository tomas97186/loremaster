import type { AiProvider } from "@/lib/db/types";

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: "Gemini (free tier)",
  claude: "Claude API",
};

/** Usa il provider scelto nella chat se valido, altrimenti quello impostato in Impostazioni. */
export function resolveProvider(override: string | undefined, fallback: string | null | undefined): AiProvider {
  if (override === "gemini" || override === "claude") return override;
  return fallback === "claude" ? "claude" : "gemini";
}
