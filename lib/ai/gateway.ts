import type { AiProvider } from "@/lib/db/types";
import type { AiMessage, AiTool, AiResult } from "./types";
import { generateWithGemini } from "./providers/gemini";
import { generateWithClaude } from "./providers/claude";
import { resolveAiKey, resolveClaudeModel } from "./keys";

export type { AiMessage, AiTool, AiResult } from "./types";
export { AiConfigError } from "./types";

/**
 * Punto unico di accesso ai provider AI. I chiamanti (Server Actions) non
 * sanno quale provider sia effettivamente in uso: passare a un provider
 * diverso in futuro significa aggiungere un file in lib/ai/providers e un
 * caso qui, senza toccare il resto dell'app.
 */
export async function askAssistant(
  provider: AiProvider,
  systemPrompt: string,
  messages: AiMessage[],
  tools?: AiTool[],
  forceToolName?: string,
): Promise<AiResult> {
  const apiKey = await resolveAiKey(provider);
  if (provider === "claude") {
    const model = await resolveClaudeModel();
    return generateWithClaude(apiKey, model, systemPrompt, messages, tools, forceToolName);
  }
  return generateWithGemini(apiKey, systemPrompt, messages, tools, forceToolName);
}
