import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import type { Campaign } from "@/lib/db/types";
import { CampaignNav } from "./campaign-nav";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("id", campaignId)
    .single<Pick<Campaign, "id" | "name">>();

  if (!campaign) {
    notFound();
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
      <div>
        <div className="mb-3 hidden sm:block">
          <p className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Campagna
          </p>
          <p className="truncate font-display text-lg font-semibold text-text">
            {campaign.name}
          </p>
        </div>
        <CampaignNav campaignId={campaignId} />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
