import { AiConfigError, type AiMessage, type AiTool, type AiResult } from "../types";

// Modello economico, adatto a un uso personale leggero. Cambialo qui se
// preferisci più qualità a fronte di un costo maggiore.
const MODEL = "claude-haiku-4-5-20251001";

export async function generateWithClaude(
  apiKey: string | undefined,
  systemPrompt: string,
  messages: AiMessage[],
  tools?: AiTool[],
  forceToolName?: string,
): Promise<AiResult> {
  if (!apiKey) throw new AiConfigError("claude");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.text })),
      ...(tools && tools.length > 0
        ? {
            tools: tools.map((t) => ({
              name: t.name,
              description: t.description,
              input_schema: t.parameters,
            })),
            tool_choice: forceToolName ? { type: "tool", name: forceToolName } : { type: "auto" },
          }
        : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const content = (data.content ?? []) as Array<{
    type: string;
    text?: string;
    name?: string;
    input?: Record<string, unknown>;
  }>;

  const toolUse = content.find((block) => block.type === "tool_use");
  if (toolUse && toolUse.name) {
    return { type: "tool_call", name: toolUse.name, input: toolUse.input ?? {} };
  }

  const text = content.map((block) => block.text ?? "").join("");
  if (!text) {
    throw new Error("Claude non ha restituito una risposta utilizzabile.");
  }

  return { type: "text", text };
}
