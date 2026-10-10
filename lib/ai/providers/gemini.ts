import { AiConfigError, type AiMessage, type AiTool, type AiResult } from "../types";

// Free tier: https://ai.google.dev/gemini-api/docs/pricing
// gemini-2.0-flash è stato ritirato; Google indica gemini-3.6-flash come sostituto.
const MODEL = "gemini-3.6-flash";

export async function generateWithGemini(
  apiKey: string | undefined,
  systemPrompt: string,
  messages: AiMessage[],
  tools?: AiTool[],
  forceToolName?: string,
): Promise<AiResult> {
  if (!apiKey) throw new AiConfigError("gemini");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.text }],
        })),
        ...(tools && tools.length > 0
          ? {
              tools: [
                {
                  functionDeclarations: tools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                  })),
                },
              ],
              toolConfig: {
                functionCallingConfig: forceToolName
                  ? { mode: "ANY", allowedFunctionNames: [forceToolName] }
                  : { mode: "AUTO" },
              },
            }
          : {}),
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];

  const functionCall = parts.find(
    (part: { functionCall?: { name: string; args?: Record<string, unknown> } }) =>
      part.functionCall,
  )?.functionCall;
  if (functionCall) {
    return { type: "tool_call", name: functionCall.name, input: functionCall.args ?? {} };
  }

  const text = parts.map((part: { text?: string }) => part.text ?? "").join("");
  if (!text) {
    throw new Error("Gemini non ha restituito una risposta utilizzabile.");
  }

  return { type: "text", text };
}
