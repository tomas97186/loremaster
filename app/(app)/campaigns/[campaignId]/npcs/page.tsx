import { createClient } from "@/lib/db/client";
import type { Npc, Location } from "@/lib/db/types";
import { EntityListPage } from "@/components/entity-list";
import { Badge } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import { stripHtml } from "@/lib/richtext";

export default async function NpcsPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ q?: string; location?: string }>;
}) {
  const { campaignId } = await params;
  const { q, location } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("npcs").select("*").eq("campaign_id", campaignId);
  if (location) query = query.eq("location_id", location);
  if (q) query = query.ilike("name", `%${q}%`);

  const [{ data: npcs }, { data: locations }] = await Promise.all([
    query.order("name").returns<Npc[]>(),
    supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name")
      .returns<Pick<Location, "id" | "name">[]>(),
  ]);

  const hasFilters = Boolean(q || location);

  return (
    <EntityListPage
      title="NPC"
      newHref={`/campaigns/${campaignId}/npcs/new`}
      newLabel="Nuovo NPC"
      items={npcs ?? []}
      basePath={(n) => `/campaigns/${campaignId}/npcs/${n.id}`}
      emptyTitle={hasFilters ? "Nessun NPC corrisponde ai filtri" : "Nessun NPC ancora"}
      emptyDescription={
        hasFilters
          ? "Prova a cambiare la ricerca o il luogo selezionato."
          : "Le persone che i giocatori incontreranno nel mondo."
      }
      filters={
        <form
          method="get"
          className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-3"
        >
          <div className="min-w-40 flex-1">
            <Input type="search" name="q" placeholder="Cerca per nome…" defaultValue={q ?? ""} />
          </div>
          <div className="min-w-40">
            <Select name="location" defaultValue={location ?? ""}>
              <option value="">Tutti i luoghi</option>
              {(locations ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Filtra
          </Button>
          {hasFilters ? (
            <ButtonLink href={`/campaigns/${campaignId}/npcs`} size="sm" variant="ghost">
              Azzera
            </ButtonLink>
          ) : null}
        </form>
      }
      renderCard={(npc) => (
        <div className="flex gap-3">
          {npc.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={npc.image_url}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-text">{npc.name}</h2>
              {npc.role ? <Badge>{npc.role}</Badge> : null}
            </div>
            {stripHtml(npc.description) ? (
              <p className="mt-2 line-clamp-3 text-sm text-text-muted">
                {stripHtml(npc.description)}
              </p>
            ) : null}
          </div>
        </div>
      )}
    />
  );
}
