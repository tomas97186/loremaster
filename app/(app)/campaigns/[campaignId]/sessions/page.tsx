import { createClient } from "@/lib/db/client";
import type { Session } from "@/lib/db/types";
import { EntityListPage } from "@/components/entity-list";
import { Badge } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { SESSION_STATUS_LABELS } from "@/lib/constants";

const STATUS_TONE = {
  planned: "accent",
  completed: "success",
  skipped: "neutral",
} as const;

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("scheduled_at", { ascending: false, nullsFirst: false })
    .returns<Session[]>();

  return (
    <EntityListPage
      title="Sessioni"
      newHref={`/campaigns/${campaignId}/sessions/new`}
      newLabel="Nuova sessione"
      items={sessions ?? []}
      basePath={(s) => `/campaigns/${campaignId}/sessions/${s.id}`}
      emptyTitle="Nessuna sessione ancora"
      emptyDescription="Pianifica la prossima sessione al tavolo."
      filters={
        <div className="flex justify-end">
          <ButtonLink href={`/campaigns/${campaignId}/sessions/import`} size="sm" variant="secondary">
            Importa sessioni
          </ButtonLink>
        </div>
      }
      renderCard={(session) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-text">
              {session.session_number ? `#${session.session_number} — ` : ""}
              {session.title}
            </h2>
            <Badge tone={STATUS_TONE[session.status]}>
              {SESSION_STATUS_LABELS[session.status]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {session.scheduled_at ? formatDateTime(session.scheduled_at) : "Data da definire"}
          </p>
        </>
      )}
    />
  );
}
