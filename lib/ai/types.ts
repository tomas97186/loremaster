export interface AiMessage {
  role: "user" | "assistant";
  text: string;
}

export interface AiToolProperty {
  type: string;
  description?: string;
  enum?: string[];
  /** Per le proprietà di tipo "array": schema degli elementi. */
  items?: AiToolProperty;
  /** Per le proprietà di tipo "object" (anche annidate dentro "items"). */
  properties?: Record<string, AiToolProperty>;
  required?: string[];
}

export interface AiTool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, AiToolProperty>;
    required?: string[];
  };
}

export type AiResult =
  | { type: "text"; text: string }
  | { type: "tool_call"; name: string; input: Record<string, unknown> };

export class AiConfigError extends Error {
  constructor(public provider: "gemini" | "claude") {
    super(
      provider === "gemini"
        ? "Chiave API di Gemini non configurata: aggiungila in Impostazioni."
        : "Chiave API di Claude non configurata: aggiungila in Impostazioni.",
    );
    this.name = "AiConfigError";
  }
}
