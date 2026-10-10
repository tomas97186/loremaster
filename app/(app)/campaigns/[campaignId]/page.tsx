import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Campaign, Quest, Session } from "@/lib/db/types";
import { Card, Badge, EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { CampaignEditForm } from "./campaign-edit-form";
import { RichTextView } from "@/components/rich-text/rich-text-view";
import Link from "next/link";

const STAT_TABLES = [
  { table: "locations", label: "Luoghi" },
  { table: "npcs", label: "NPC" },
  { table: "characters", label: "Personaggi" },
  { table: "factions", label: "Fazioni" },
  { table: "quests", label: "Quest" },
  { table: "items", label: "Oggetti" },
] as const;

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const [{ data: campaign }, stats, { data: nextSession }, { data: activeQuests }, mentionable] =
    await Promise.all([
      supabase.from("campaigns").select("*").eq("id", campaignId).single<Campaign>(),
      Promise.all(
        STAT_TABLES.map(async ({ table }) => {
          const { count } = await supabase
            .from(table)
            .select("id", { count: "exact", head: true })
            .eq("campaign_id", campaignId);
          return count ?? 0;
        }),
      ),
      supabase
        .from("sessions")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("status", "planned")
        .order("scheduled_at", { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle<Session>(),
      supabase
        .from("quests")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(5)
        .returns<Quest[]>(),
      getMentionableEntities(supabase, campaignId),
    ]);

  if (!campaign) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-gold">
            {campaign.system ?? "Panoramica"}
          </p>
          <h1 className="font-display text-3xl font-semibold text-text">
            {campaign.name}
          </h1>
          {campaign.description ? (
            <div className="mt-2 max-w-2xl">
              <RichTextView html={campaign.description} campaignId={campaignId} />
            </div>
          ) : null}
        </div>
        <ButtonLink href={`/campaigns/${campaignId}/sessions/new`}>
          Nuova sessione
        </ButtonLink>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_TABLES.map(({ table, label }, i) => (
          <Link key={table} href={`/campaigns/${campaignId}/${table}`} className="block">
            <Card className="text-center transition-colors hover:border-border-strong">
              <p className="font-display text-2xl font-semibold text-text">
                {stats[i]}
              </p>
              <p className="text-xs text-text-muted">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-lg font-semibold text-text">
            Prossima sessione
          </h2>
          {nextSession ? (
            <Link
              href={`/campaigns/${campaignId}/sessions/${nextSession.id}`}
              className="block rounded-lg border border-border p-3 hover:border-border-strong"
            >
              <p className="font-medium text-text">{nextSession.title}</p>
              <p className="text-xs text-text-muted">
                {nextSession.scheduled_at
                  ? formatDateTime(nextSession.scheduled_at)
                  : "Data da definire"}
              </p>
            </Link>
          ) : (
            <EmptyState
              title="Nessuna sessione pianificata"
              description="Prepara la prossima sessione quando vuoi."
              action={
                <ButtonLink
                  href={`/campaigns/${campaignId}/sessions/new`}
                  size="sm"
                  variant="secondary"
                >
                  Pianifica sessione
                </ButtonLink>
              }
            />
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg font-semibold text-text">
            Quest attive
          </h2>
          {activeQuests && activeQuests.length > 0 ? (
            <ul className="space-y-2">
              {activeQuests.map((quest) => (
                <li key={quest.id}>
                  <Link
                    href={`/campaigns/${campaignId}/quests/${quest.id}`}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:border-border-strong"
                  >
                    <span className="text-sm text-text">{quest.title}</span>
                    <Badge tone="accent">Attiva</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nessuna quest attiva"
              action={
                <ButtonLink
                  href={`/campaigns/${campaignId}/quests/new`}
                  size="sm"
                  variant="secondary"
                >
                  Aggiungi quest
                </ButtonLink>
              }
            />
          )}
        </Card>
      </div>

      <details className="rounded-xl border border-border bg-surface">
        <summary className="cursor-pointer select-none px-5 py-4 font-display text-lg font-semibold text-text">
          Impostazioni campagna
        </summary>
        <div className="border-t border-border p-5">
          <CampaignEditForm campaign={campaign} mentionable={mentionable} />
        </div>
      </details>
    </div>
  );
}
