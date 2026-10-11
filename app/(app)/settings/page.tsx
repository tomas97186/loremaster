import { createClient } from "@/lib/db/client";
import { signOut } from "../../(auth)/actions";
import { updateAiProvider, updateAiKeys, updateClaudeModel } from "./actions";
import { CLAUDE_MODELS, normalizeClaudeModel } from "@/lib/ai/claude-models";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Input, Select } from "@/components/ui/field";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("ai_provider, claude_model, gemini_api_key, anthropic_api_key")
    .maybeSingle();

  const keyHint = (key: string | null | undefined, envName: string) =>
    key
      ? `Salvata (termina con …${key.slice(-4)}). Lascia vuoto per non modificarla.`
      : process.env[envName]
        ? "Nessuna chiave salvata: viene usata quella del server."
        : "Nessuna chiave configurata.";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-text">Impostazioni</h1>

      <Card>
        <h2 className="mb-3 font-display text-lg font-semibold text-text">Profilo</h2>
        <p className="text-sm text-text-muted">{user?.email}</p>
        <form action={signOut} className="mt-4">
          <Button type="submit" variant="secondary" size="sm">
            Esci
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-lg font-semibold text-text">AI</h2>
        <form action={updateAiProvider}>
          <Field
            label="Provider assistente AI"
            htmlFor="ai_provider"
            hint="Le chiavi API si impostano nel riquadro qui sotto."
          >
            <Select
              key={settings?.ai_provider ?? "gemini"}
              id="ai_provider"
              name="ai_provider"
              defaultValue={settings?.ai_provider ?? "gemini"}
            >
              <option value="gemini">Gemini (free tier — default)</option>
              <option value="claude">Claude API (a consumo, richiede una chiave Anthropic)</option>
            </Select>
          </Field>
          <SubmitButton size="sm">
            Salva
          </SubmitButton>
        </form>
        <form action={updateClaudeModel} className="mt-6">
          <Field
            label="Modello Claude"
            htmlFor="claude_model"
            hint="Usato quando il provider è Claude. Prezzi indicativi in $ per milione di token (input / output)."
          >
            <Select
              key={normalizeClaudeModel(settings?.claude_model)}
              id="claude_model"
              name="claude_model"
              defaultValue={normalizeClaudeModel(settings?.claude_model)}
            >
              {CLAUDE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} · {m.price}
                </option>
              ))}
            </Select>
          </Field>
          <SubmitButton size="sm">Salva modello</SubmitButton>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-lg font-semibold text-text">Chiavi API</h2>
        <form action={updateAiKeys}>
          <Field
            label="Gemini API key"
            htmlFor="gemini_api_key"
            hint={keyHint(settings?.gemini_api_key, "GEMINI_API_KEY")}
          >
            <Input id="gemini_api_key" name="gemini_api_key" type="password" autoComplete="off" placeholder="AIza…" />
          </Field>
          {settings?.gemini_api_key ? (
            <label className="-mt-2 mb-4 flex items-center gap-2 text-sm text-text-muted">
              <input type="checkbox" name="clear_gemini_api_key" /> Rimuovi la chiave salvata
            </label>
          ) : null}
          <Field
            label="Anthropic (Claude) API key"
            htmlFor="anthropic_api_key"
            hint={keyHint(settings?.anthropic_api_key, "ANTHROPIC_API_KEY")}
          >
            <Input id="anthropic_api_key" name="anthropic_api_key" type="password" autoComplete="off" placeholder="sk-ant-…" />
          </Field>
          {settings?.anthropic_api_key ? (
            <label className="-mt-2 mb-4 flex items-center gap-2 text-sm text-text-muted">
              <input type="checkbox" name="clear_anthropic_api_key" /> Rimuovi la chiave salvata
            </label>
          ) : null}
          <SubmitButton size="sm">Salva chiavi</SubmitButton>
        </form>
        <p className="mt-3 text-xs text-text-muted">
          Le chiavi sono salvate nel database del server e non vengono mai mostrate per intero.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-lg font-semibold text-text">Campagna</h2>
        <p className="text-sm text-text-muted">
          Nome, ambientazione e note di ogni campagna si modificano dalla sua
          Panoramica, sotto &quot;Impostazioni campagna&quot;.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-lg font-semibold text-text">Storage</h2>
        <p className="text-sm text-text-muted">
          Le immagini caricate vengono salvate sul server, nel volume Docker
          montato su /data/uploads (nessun servizio esterno).
        </p>
      </Card>
    </div>
  );
}
