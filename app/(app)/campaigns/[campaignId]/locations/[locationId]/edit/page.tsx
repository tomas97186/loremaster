import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Location } from "@/lib/db/types";
import { updateLocation, deleteLocation } from "../../actions";
import { LocationForm } from "../../location-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ campaignId: string; locationId: string }>;
}) {
  const { campaignId, locationId } = await params;
  const supabase = await createClient();

  const [{ data: location }, { data: otherLocations }, mentionable] = await Promise.all([
    supabase.from("locations").select("*").eq("id", locationId).single<Location>(),
    supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name")
      .returns<Pick<Location, "id" | "name">[]>(),
    getMentionableEntities(supabase, campaignId),
  ]);

  if (!location) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">
        {location.name}
      </h1>
      <LocationForm
        campaignId={campaignId}
        action={updateLocation.bind(null, campaignId, locationId)}
        location={location}
        otherLocations={otherLocations ?? []}
        mentionable={mentionable}
      />
      <form action={deleteLocation.bind(null, campaignId, locationId)} className="mt-4 flex justify-end">
        <ConfirmSubmitButton
          size="sm"
          confirmMessage={`Eliminare "${location.name}"? L'azione non è reversibile.`}
        >
          Elimina luogo
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
