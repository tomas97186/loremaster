import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Location } from "@/lib/db/types";
import { createLocation } from "../actions";
import { LocationForm } from "../location-form";

export default async function NewLocationPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const [{ data: otherLocations }, mentionable] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name")
      .returns<Pick<Location, "id" | "name">[]>(),
    getMentionableEntities(supabase, campaignId),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">Nuovo luogo</h1>
      <LocationForm
        campaignId={campaignId}
        action={createLocation.bind(null, campaignId)}
        otherLocations={otherLocations ?? []}
        mentionable={mentionable}
      />
    </div>
  );
}
