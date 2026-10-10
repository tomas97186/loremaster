import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Item, Location, Npc } from "@/lib/db/types";
import { updateItem, deleteItem } from "../../actions";
import { ItemForm } from "../../item-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ campaignId: string; itemId: string }>;
}) {
  const { campaignId, itemId } = await params;
  const supabase = await createClient();

  const [{ data: item }, { data: locations }, { data: npcs }, mentionable] = await Promise.all([
    supabase.from("items").select("*").eq("id", itemId).single<Item>(),
    supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name")
      .returns<Pick<Location, "id" | "name">[]>(),
    supabase
      .from("npcs")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name")
      .returns<Pick<Npc, "id" | "name">[]>(),
    getMentionableEntities(supabase, campaignId),
  ]);

  if (!item) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">{item.name}</h1>
      <ItemForm
        campaignId={campaignId}
        action={updateItem.bind(null, campaignId, itemId)}
        item={item}
        locations={locations ?? []}
        npcs={npcs ?? []}
        mentionable={mentionable}
      />
      <form action={deleteItem.bind(null, campaignId, itemId)} className="mt-4 flex justify-end">
        <ConfirmSubmitButton
          size="sm"
          confirmMessage={`Eliminare "${item.name}"? L'azione non è reversibile.`}
        >
          Elimina oggetto
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
