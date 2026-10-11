import { AiConfigError, type AiMessage, type AiTool, type AiResult } from "../types";

export async function generateWithClaude(
  apiKey: string | undefined,
  model: string,
  systemPrompt: string,
  messages: AiMessage[],
  tools?: AiTool[],
  forceToolName?: string,
): Promise<AiResult> {
  if (!apiKey) throw new AiConfigError("claude");

  // I modelli 5.x non accettano di forzare uno strumento (tool_choice "tool"):
  // va richiesto a parole, altrimenti il modello può rispondere a testo.
  const system = forceToolName
    ? `${systemPrompt}

Rispondi usando esclusivamente lo strumento ${forceToolName}.`
    : systemPrompt;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      // Margine per il ragionamento dei modelli 5.x, che conta nei token di output.
      max_tokens: 8192,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.text })),
      ...(tools && tools.length > 0
        ? {
            tools: tools.map((t) => ({
              name: t.name,
              description: t.description,
              input_schema: t.parameters,
            })),
            tool_choice: { type: "auto" },
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
