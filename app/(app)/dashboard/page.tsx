import Link from "next/link";
import { createClient } from "@/lib/db/client";
import type { Campaign } from "@/lib/db/types";
import { Card, EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { stripHtml } from "@/lib/richtext";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<Campaign[]>();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-gold">
            Dashboard
          </p>
          <h1 className="font-display text-3xl font-semibold text-text">
            Le tue campagne
          </h1>
        </div>
        <ButtonLink href="/campaigns/new">Nuova campagna</ButtonLink>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="h-full transition-colors hover:border-border-strong">
                <p className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
                  {campaign.system ?? "Campagna"}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold text-text">
                  {campaign.name}
                </h2>
                {stripHtml(campaign.description) ? (
                  <p className="mt-2 line-clamp-3 text-sm text-text-muted">
                    {stripHtml(campaign.description)}
                  </p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nessuna campagna ancora"
          description="Crea la tua prima campagna per iniziare a costruire il mondo, le sessioni e le note."
          action={<ButtonLink href="/campaigns/new">Crea la prima campagna</ButtonLink>}
        />
      )}
    </div>
  );
}
