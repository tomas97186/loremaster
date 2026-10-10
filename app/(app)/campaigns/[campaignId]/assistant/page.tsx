import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { AiProvider } from "@/lib/db/types";
import { AssistantPanel } from "./assistant-panel";

export default async function CampaignAssistantPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const [mentionable, { data: settings }] = await Promise.all([
    getMentionableEntities(supabase, campaignId),
    supabase.from("user_settings").select("ai_provider").maybeSingle(),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">Assistente</h1>
      <AssistantPanel
        campaignId={campaignId}
        mentionable={mentionable}
        aiProvider={(settings?.ai_provider as AiProvider) ?? "gemini"}
      />
    </div>
  );
}
