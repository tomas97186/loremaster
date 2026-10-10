import Link from "next/link";
import { createClient } from "@/lib/db/client";
import type { Location } from "@/lib/db/types";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/card";

function LocationNode({
  location,
  childrenByParent,
  campaignId,
}: {
  location: Location;
  childrenByParent: Map<string | null, Location[]>;
  campaignId: string;
}) {
  const children = childrenByParent.get(location.id) ?? [];

  const row = (
    <Link
      href={`/campaigns/${campaignId}/locations/${location.id}`}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
    >
      <span className="text-sm font-medium text-text">{location.name}</span>
      {location.type ? (
        <Badge tone="gold" className="normal-case">
          {location.type}
        </Badge>
      ) : null}
    </Link>
  );

  if (children.length === 0) {
    return <li>{row}</li>;
  }

  return (
    <li>
      <details open>
        <summary className="cursor-pointer list-none">{row}</summary>
        <ul className="ml-5 border-l border-border pl-3">
          {children.map((child) => (
            <LocationNode
              key={child.id}
              location={child}
              childrenByParent={childrenByParent}
              campaignId={campaignId}
            />
          ))}
        </ul>
      </details>
    </li>
  );
}

export default async function LocationsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("name")
    .returns<Location[]>();

  const childrenByParent = new Map<string | null, Location[]>();
  for (const location of locations ?? []) {
    const key = location.parent_id;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key)!.push(location);
  }
  const roots = childrenByParent.get(null) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-text">Luoghi</h1>
        <ButtonLink href={`/campaigns/${campaignId}/locations/new`} size="sm">
          Nuovo luogo
        </ButtonLink>
      </div>

      {roots.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-border bg-surface p-3">
          {roots.map((location) => (
            <LocationNode
              key={location.id}
              location={location}
              childrenByParent={childrenByParent}
              campaignId={campaignId}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nessun luogo ancora"
          description="Comincia dal mondo, poi scendi in continenti, regioni, città..."
          action={
            <ButtonLink href={`/campaigns/${campaignId}/locations/new`} size="sm">
              Aggiungi il primo luogo
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
